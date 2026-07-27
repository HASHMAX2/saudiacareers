import assert from "node:assert/strict";
import test from "node:test";
import { updateProfileSchema } from "../src/validation/profileSchemas.js";

test("profile validation accepts a supported country with a city", () => {
  const result = updateProfileSchema.safeParse({
    body: {
      country: "Saudi Arabia",
      city: "Riyadh",
      designation: "Engineer",
      experience: "3 years",
      skills: "Node.js, React",
    },
    params: {},
    query: {},
  });
  assert.equal(result.success, true);
});

test("profile validation rejects unsupported countries", () => {
  const result = updateProfileSchema.safeParse({
    body: { country: "Narnia" },
    params: {},
    query: {},
  });
  assert.equal(result.success, false);
});

test("profile validation rejects a city without a selected country", () => {
  const result = updateProfileSchema.safeParse({
    body: { city: "Riyadh" },
    params: {},
    query: {},
  });
  assert.equal(result.success, false);
});

test("profile validation rejects invalid marital status and work authorization values", () => {
  const result = updateProfileSchema.safeParse({
    body: { maritalStatus: "Complicated", visaStatus: "Maybe" },
    params: {},
    query: {},
  });
  assert.equal(result.success, false);
});

test("profile validation rejects a calendar-invalid date of birth", () => {
  const result = updateProfileSchema.safeParse({
    body: { dateOfBirth: "2024-02-30" },
    params: {},
    query: {},
  });
  assert.equal(result.success, false);
});

test("profile validation accepts a valid date of birth", () => {
  const result = updateProfileSchema.safeParse({
    body: { dateOfBirth: "1995-12-05" },
    params: {},
    query: {},
  });
  assert.equal(result.success, true);
});
