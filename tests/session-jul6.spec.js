import { test, expect, request } from "@playwright/test";

const API = "http://localhost:5000/api";

// ─── 1. Zod schema — q param accepted ────────────────────────────────────────
test("listJobsSchema accepts q param", async () => {
  const { listJobsSchema } = await import("../backend/src/validation/jobSchemas.js");
  const result = listJobsSchema.safeParse({
    body: {},
    params: {},
    query: { q: "civil engineer" },
  });
  expect(result.success).toBe(true);
  expect(result.data.query.q).toBe("civil engineer");
});

test("listJobsSchema strips q longer than 200 chars", async () => {
  const { listJobsSchema } = await import("../backend/src/validation/jobSchemas.js");
  const result = listJobsSchema.safeParse({
    body: {},
    params: {},
    query: { q: "a".repeat(201) },
  });
  expect(result.success).toBe(false);
});

// ─── 2. API — job search returns relevant results ─────────────────────────────
test("GET /api/jobs?q=civil returns civil engineer jobs", async ({ request: req }) => {
  const res = await req.get(`${API}/jobs?q=civil`);
  expect(res.ok()).toBe(true);
  const body = await res.json();
  expect(body.data.jobs.length).toBeGreaterThan(0);
  const titles = body.data.jobs.map((j) => j.title.toLowerCase());
  expect(titles.some((t) => t.includes("civil"))).toBe(true);
});

test("GET /api/jobs?q=react returns react developer jobs", async ({ request: req }) => {
  const res = await req.get(`${API}/jobs?q=react`);
  expect(res.ok()).toBe(true);
  const body = await res.json();
  const titles = body.data.jobs.map((j) => j.title.toLowerCase());
  expect(titles.some((t) => t.includes("react"))).toBe(true);
});

test("GET /api/jobs?q=nonexistentxyzabc returns 0 jobs", async ({ request: req }) => {
  const res = await req.get(`${API}/jobs?q=nonexistentxyzabc`);
  expect(res.ok()).toBe(true);
  const body = await res.json();
  expect(body.data.jobs.length).toBe(0);
  expect(body.data.pagination.total).toBe(0);
});

// ─── 3. API — 50 jobs seeded, total ≥ 50 ─────────────────────────────────────
test("GET /api/jobs returns at least 50 total jobs", async ({ request: req }) => {
  const res = await req.get(`${API}/jobs?limit=50`);
  expect(res.ok()).toBe(true);
  const body = await res.json();
  expect(body.data.pagination.total).toBeGreaterThanOrEqual(50);
});

// ─── 4. API — filter-options returns industry counts ─────────────────────────
test("GET /api/jobs/filter-options returns industries with name and count", async ({ request: req }) => {
  const res = await req.get(`${API}/jobs/filter-options`);
  expect(res.ok()).toBe(true);
  const body = await res.json();
  const industries = body.data.industries;
  expect(Array.isArray(industries)).toBe(true);
  expect(industries.length).toBeGreaterThan(0);
  // Each entry must have name (string) and count (positive number)
  for (const ind of industries) {
    expect(typeof ind.name).toBe("string");
    expect(typeof ind.count).toBe("number");
    expect(ind.count).toBeGreaterThan(0);
  }
  // Technology should have the most jobs (we seeded many tech jobs)
  const tech = industries.find((i) => i.name === "Technology");
  expect(tech).toBeTruthy();
  expect(tech.count).toBeGreaterThan(3);
});

// ─── 5. UI — Jobs page search bar present ────────────────────────────────────
test("Jobs page has a visible search bar", async ({ page }) => {
  await page.goto("/jobs");
  const searchInput = page.locator('input[type="search"]');
  await expect(searchInput).toBeVisible();
  await expect(searchInput).toHaveAttribute("placeholder", /title|skill|company/i);
});

// ─── 6. UI — Search "Civil Engineer" shows relevant jobs ──────────────────────
test("searching 'Civil Engineer' shows civil engineer job in results", async ({ page }) => {
  await page.goto("/jobs");
  const input = page.locator('input[type="search"]');
  await input.fill("Civil Engineer");
  // Wait for debounce (400ms) + network
  await page.waitForTimeout(700);
  await page.waitForSelector(".grid .card-soft, .grid [class*='rounded']", { timeout: 5000 }).catch(() => {});
  const pageText = await page.content();
  expect(pageText.toLowerCase()).toContain("civil engineer");
});

// ─── 7. UI — No divider "Browse all open roles" heading visible ───────────────
test("no divider heading 'Browse all open roles' when no search", async ({ page }) => {
  await page.goto("/jobs");
  const divider = page.getByText("Browse all open roles");
  await expect(divider).not.toBeVisible();
});

test("no divider heading 'Browse all open roles' when search active", async ({ page }) => {
  await page.goto("/jobs?q=React");
  await page.waitForTimeout(700);
  const divider = page.getByText("Browse all open roles");
  await expect(divider).not.toBeVisible();
});

// ─── 8. UI — Filter panel shows count badge on industry items ─────────────────
test("industry filter items show job count badges", async ({ page }) => {
  await page.goto("/jobs");
  // Wait for filter options to load
  await page.waitForTimeout(1000);
  // Open the Industry filter card if collapsed
  const industrySection = page.locator("text=Industry").first();
  await expect(industrySection).toBeVisible();
  // Count badges — tabular-nums small numbers next to industry names
  const countBadges = page.locator(".tabular-nums");
  const count = await countBadges.count();
  expect(count).toBeGreaterThan(0);
});

// ─── 9. UI — ProfileCard missing-fields rows have no Upload/Add buttons ───────
test("dashboard ProfileCard missing-fields rows have no Add/Upload action links", async ({ page }) => {
  // Register via API using page.request — shares the cookie jar with the page,
  // so the httpOnly refresh-token cookie is set automatically.
  const email = `test_${Date.now()}@example.com`;
  const regRes = await page.request.post(`${API}/auth/register`, {
    data: { name: "Test User", email, mobile: "+966501234567", password: "Password1" },
  });
  expect(regRes.ok()).toBeTruthy();

  // Navigate to dashboard — App.jsx calls restoreSession() on mount which uses
  // the refresh-token cookie to hydrate the Zustand auth state.
  await page.goto("/dashboard");
  await page.waitForTimeout(2500);

  // The ProfileCard missing-fields section must not contain "Add" or "Upload" action links
  const profileCard = page.locator(".rounded-2xl").first();
  const addButtons = profileCard.locator("a, button").filter({ hasText: /^(Add|Upload)$/ });
  await expect(addButtons).toHaveCount(0);
});

// ─── 10. UI — "Results for X" label + Clear button appear on search ───────────
test("search shows 'Results for' label with clear button", async ({ page }) => {
  await page.goto("/jobs?q=Node");
  await page.waitForTimeout(700);
  const resultsLabel = page.locator("p").filter({ hasText: /results for/i });
  await expect(resultsLabel).toBeVisible();
  await expect(resultsLabel.getByRole("button", { name: /clear/i })).toBeVisible();
});

test("clearing search removes 'Results for' label", async ({ page }) => {
  await page.goto("/jobs?q=Node");
  await page.waitForTimeout(700);
  const resultsLabel = page.locator("p").filter({ hasText: /results for/i });
  await resultsLabel.getByRole("button", { name: /clear/i }).click();
  await page.waitForTimeout(200);
  await expect(resultsLabel).not.toBeVisible();
});
