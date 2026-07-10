// Zod validation errors are wrapped in an envelope ({ body, params, query }) before
// being flattened server-side, so express-validator-style per-field names get lost —
// `.flatten()` buckets every body-level issue under a single "body" key. The messages
// themselves are still specific and human-readable, so surface those directly instead
// of the generic "Validation failed" wrapper text.
export function extractErrorMessage(requestError, fallback = "Something went wrong") {
  const data = requestError?.response?.data;
  const bodyIssues = data?.details?.fieldErrors?.body;
  if (Array.isArray(bodyIssues) && bodyIssues.length > 0) {
    return bodyIssues.join(" ");
  }
  return data?.message ?? fallback;
}
