import assert from "node:assert/strict";
import test from "node:test";
import { listJobsSchema } from "../src/validation/jobSchemas.js";

test("job query applies pagination defaults", () => {
  const result = listJobsSchema.safeParse({ body: {}, params: {}, query: {} });
  assert.equal(result.success, true);
  assert.equal(result.data.query.page, 1);
  assert.equal(result.data.query.limit, 10);
  assert.equal(result.data.query.sort, "newest");
});

test("job query rejects excessive page sizes", () => {
  const result = listJobsSchema.safeParse({
    body: {},
    params: {},
    query: { limit: "1000" },
  });
  assert.equal(result.success, false);
});

