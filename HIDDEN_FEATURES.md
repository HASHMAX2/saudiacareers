# Hidden Dashboard Features

Sections removed from candidate view because they show hardcoded placeholder
data with no real backend behind them yet, or link to pages/features that
don't exist ("#" hrefs). Kept in the codebase, gated behind one flag, so they
can be re-enabled and wired up to real data as each feature is built.

## How to re-enable

`frontend/src/pages/candidate/Dashboard.jsx` — flip the module-level constant:

```js
const SHOW_HIDDEN_DASHBOARD_SECTIONS = false; // set to true
```

All sections below share this single flag. Enable them individually by
splitting the flag once a given section is ready for real data (e.g.
`SHOW_TOP_EMPLOYERS`, `SHOW_CAREER_TIPS`, etc.) instead of one shared boolean.

## Hidden sections

| Card / Section | What it shows today | What's needed before re-enabling |
|---|---|---|
| **Jobs by top employers** | Hardcoded `TOP_EMPLOYERS` name list (`Dashboard.jsx`), links go to `#` | Real employer list from DB (e.g. distinct `companyName` from active jobs, or a dedicated featured-employer flag), working links to employer/job-search filtered by company |
| **Career tips** | Fetched via `candidateApi.careerTips()` — check whether this is real content or mock data in the backend | Confirm backend `careerTips` endpoint serves real, maintained articles; "Read more" currently has no destination |
| **Companies hiring for** | Hardcoded `COMPANIES_HIRING` array with fake tags | Replace with a real query — e.g. top companies by open job count matching the candidate's profile/designation |
| **Featured employers** / **Featured consultants** | Hardcoded `FEATURED_EMPLOYERS` / `FEATURED_CONSULTANTS` arrays, links go to `#` | Needs a real "featured" concept — likely a paid placement / admin-curated list — plus a real destination page |
| **"Make sure every detail is filled in correctly…" reminder banner** | Static banner linking to `/dashboard/profile` | Functionally fine as-is; was hidden together with the rest of the unfinished block below it. Safe to re-enable independently — arguably should be un-hidden now since it's fully functional today |
| **Boost your job hunt** (Resume writing / Resume spotlight) | Static promo section, "Know more" links go to `#` | Needs real premium/paid features (resume writing service, spotlight placement) before it can point anywhere real |
| **YOUR OPINION MATTERS** (`PollWidget.jsx`) | Standalone sidebar poll widget | Check whether poll answers are actually persisted/read anywhere on the backend, or if it's still a static mock |
| **Frequently asked** (`FAQCard.jsx`) | Static FAQ list (`FAQS` array in the component) | Content is real/static and safe to re-enable independently — was only hidden because it shipped in the same pass as the mock sections |

## Notes

- `TOP_EMPLOYERS`, `FEATURED_EMPLOYERS`, `FEATURED_CONSULTANTS`, and
  `COMPANIES_HIRING` constants are still defined at the top of `Dashboard.jsx`
  — not deleted, just unused while hidden.
- The "Applied" / "Saved" / "Alerts" tab strip, action stat cards, profile
  card, and visibility chart in the sidebar were **not** hidden — those are
  wired to real data and working correctly.
