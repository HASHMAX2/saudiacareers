import assert from "node:assert/strict";
import test from "node:test";
import { updateProfileSchema } from "../src/validation/profileSchemas.js";

test("profile validation accepts supported Saudi locations", () => {
  const result = updateProfileSchema.safeParse({
    body: {
      location: "Riyadh",
      designation: "Engineer",
      experience: "3 years",
      skills: "Node.js, React",
    },
    params: {},
    query: {},
  });
  assert.equal(result.success, true);
});

test("profile validation rejects unsupported locations", () => {
  const result = updateProfileSchema.safeParse({
    body: { location: "London" },
    params: {},
    query: {},
  });
  assert.equal(result.success, false);
});

