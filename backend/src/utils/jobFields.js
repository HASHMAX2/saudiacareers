// The job content fields a revision carries — everything an employer can
// actually edit. Excludes status/credit/ownership/moderation bookkeeping
// (status, creditSource, expiresAt, createdBy, isDeleted, flagReasons,
// reviewNote, revisesJobId, id, timestamps), which are managed by the
// review workflow itself, not copied between a revision and its original.
export const REVISABLE_JOB_FIELDS = [
  "title",
  "companyName",
  "location",
  "industry",
  "employmentType",
  "experienceRequired",
  "salaryRange",
  "description",
  "requiredSkills",
  "hrEmail",
  "gender",
  "nationality",
  "applicationDeadline",
  "department",
  "workMode",
  "applyMethod",
  "applyContact",
  "screeningQuestion",
  "listingDurationDays",
];

export function pickRevisableFields(job) {
  return Object.fromEntries(REVISABLE_JOB_FIELDS.map((field) => [field, job[field]]));
}
