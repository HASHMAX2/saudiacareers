import { ApiError } from "./ApiError.js";

// Shared gate for every place a job (or a revision to one) is allowed to go
// live. Two independent employer-controller paths (create, republish) already
// checked both isSuspended and verificationStatus correctly. The admin
// approval path did not — it checked verification but not suspension for a
// brand-new job, and checked neither for a revision merge onto an
// already-live job (SA-07 and its revision-path extension). Centralizing the
// check here means a future fourth publish path can't silently reintroduce
// the same gap.
export function assertEmployerCanPublish(employerProfile) {
  if (employerProfile.isSuspended) {
    throw new ApiError(403, "This employer's account is suspended — the job can't be approved or published.");
  }
  if (employerProfile.verificationStatus !== "APPROVED") {
    throw new ApiError(403, "This employer's company verification is not approved — the job can't be approved or published.");
  }
}
