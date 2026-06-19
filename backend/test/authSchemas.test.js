import assert from "node:assert/strict";
import test from "node:test";
import {
  changePasswordSchema,
  registerSchema,
} from "../src/validation/authSchemas.js";

test("registration accepts valid Saudi candidate details", () => {
  const result = registerSchema.safeParse({
    body: {
      name: "Test Candidate",
      email: "TEST@example.com",
      mobile: "+966512345678",
      password: "Password1",
    },
    params: {},
    query: {},
  });
  assert.equal(result.success, true);
  assert.equal(result.data.body.email, "test@example.com");
});

test("registration rejects weak passwords and invalid mobile numbers", () => {
  const result = registerSchema.safeParse({
    body: {
      name: "Test Candidate",
      email: "test@example.com",
      mobile: "0512345678",
      password: "password",
    },
    params: {},
    query: {},
  });
  assert.equal(result.success, false);
});

test("change password rejects reusing the current password", () => {
  const result = changePasswordSchema.safeParse({
    body: { currentPassword: "Password1", newPassword: "Password1" },
    params: {},
    query: {},
  });
  assert.equal(result.success, false);
});

