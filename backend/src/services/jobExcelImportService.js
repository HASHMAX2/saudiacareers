import * as XLSX from "xlsx";
import { normalizeJobLocation } from "../utils/locationNormalizer.js";

const MAX_ROWS = 200;

// Maps a normalized (lowercased, alphanumeric-only) header to the canonical
// job field it represents — lets the sheet use any of the common header
// spellings ("Company Name", "company_name", "Company") for the same column.
// "contact" is not a real Job field — it's classified into hrEmail /
// applyMethod+applyContact / a description note once the whole row is read,
// since real-world sheets mix plain emails, application-form links, and
// "check our portal"-style text in the same column.
const FIELD_ALIASES = {
  title: "title",
  jobtitle: "title",
  role: "title",
  companyname: "companyName",
  company: "companyName",
  location: "location",
  city: "location",
  branch: "location",
  industry: "industry",
  employmenttype: "employmentType",
  jobtype: "employmentType",
  type: "employmentType",
  experiencerequired: "experienceRequired",
  experience: "experienceRequired",
  salaryrange: "salaryRange",
  salary: "salaryRange",
  description: "description",
  jobdescription: "description",
  details: "description",
  requirements: "description",
  requirementsdescription: "description",
  jobdetails: "description",
  requiredskills: "requiredSkills",
  skills: "requiredSkills",
  hremail: "contact",
  email: "contact",
  contactemail: "contact",
  contact: "contact",
  applyto: "contact",
  howtoapply: "contact",
  applicationdeadline: "applicationDeadline",
  deadline: "applicationDeadline",
};

const EMPTY_JOB = {
  title: "", companyName: "", location: "", industry: "", employmentType: "",
  experienceRequired: "", salaryRange: "", description: "", requiredSkills: "",
  hrEmail: "", applicationDeadline: "", applyMethod: "PLATFORM", applyContact: "",
};

// Values sheets commonly use to mean "no data", which should be treated as
// empty rather than displayed to candidates as if they were real content.
const PLACEHOLDER_VALUES = new Set(["not specified", "n/a", "na", "tbd", "-", "none", "nil"]);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_RE = /^https?:\/\//i;

function normalizeHeader(header) {
  return String(header ?? "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

function cellToString(value) {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) {
    // Excel date cells (parsed thanks to cellDates:true) → plain YYYY-MM-DD,
    // matching what the AI-import path and JobForm's date input both expect.
    return value.toISOString().slice(0, 10);
  }
  const str = String(value).trim();
  return PLACEHOLDER_VALUES.has(str.toLowerCase()) ? "" : str;
}

// The "contact" column in real recruiter sheets is whatever the source had
// handy — a real email, an application-form link, or just instructional text
// like "Check Feedco portal" with no actual address or URL. Each needs to
// land somewhere different: a real email routes automatic HR delivery, a
// link becomes an external apply redirect, and anything else that isn't
// either of those is preserved as a note in the description rather than
// silently dropped or shoved into hrEmail where it would fail validation.
function classifyContact(raw) {
  const value = raw.trim();
  if (!value) return {};
  if (EMAIL_RE.test(value)) return { hrEmail: value.toLowerCase() };
  if (URL_RE.test(value)) return { applyMethod: "EXTERNAL_URL", applyContact: value };
  return { applyNote: value };
}

export function parseJobsFromExcel(buffer) {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error("The spreadsheet has no sheets");
  const sheet = workbook.Sheets[sheetName];

  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "", raw: true });
  if (!rows.length) throw new Error("The spreadsheet has no data rows");
  if (rows.length > MAX_ROWS) throw new Error(`Too many rows — max ${MAX_ROWS} jobs per file`);

  // Build a per-row column-name → canonical-field lookup once, from that
  // row's own keys (sheet_to_json uses the header row as object keys).
  return rows.map((row) => {
    const job = { ...EMPTY_JOB };
    let contactRaw = "";
    for (const [header, value] of Object.entries(row)) {
      const field = FIELD_ALIASES[normalizeHeader(header)];
      if (field === "contact") contactRaw = cellToString(value);
      else if (field) job[field] = cellToString(value);
    }

    const { hrEmail, applyMethod, applyContact, applyNote } = classifyContact(contactRaw);
    if (hrEmail) job.hrEmail = hrEmail;
    if (applyMethod) { job.applyMethod = applyMethod; job.applyContact = applyContact; }
    if (applyNote) job.description = job.description ? `Apply via: ${applyNote}\n\n${job.description}` : `Apply via: ${applyNote}`;

    // The location dropdown only accepts one of a fixed list of Saudi cities —
    // raw spreadsheet text ("Al-Khobar", "Riyadh, KSA", typos, etc.) otherwise
    // wouldn't match any option and would silently block publishing.
    if (job.location) job.location = normalizeJobLocation(job.location);
    return job;
  });
}
