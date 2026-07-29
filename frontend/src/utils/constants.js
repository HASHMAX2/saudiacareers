// Jobs are Saudi Arabia only, so this list of major cities is treated as fixed —
// used for both the job-posting form and the job-search location filter so the
// two always stay in sync. "Other" is a catch-all for anywhere not listed.
export const LOCATIONS = [
  "Riyadh",
  "Jeddah",
  "Mecca",
  "Medina",
  "Dammam",
  "Khobar",
  "Dhahran",
  "Jubail",
  "Taif",
  "Abha",
  "Khamis Mushait",
  "Najran",
  "Jizan",
  "Tabuk",
  "Hail",
  "Buraidah",
  "Al Kharj",
  "Hafar Al-Batin",
  "Yanbu",
  "Al Ahsa",
  "Qatif",
  "Arar",
  "Sakaka",
  "Other",
];

export const INDUSTRIES = [
  "IT - Software Services",
  "Finance & Banking",
  "Healthcare & Pharmaceuticals",
  "Retail & Consumer Goods",
  "Oil, Gas & Energy",
  "Construction & Real Estate",
  "Education & Training",
  "Media & Entertainment",
  "Hospitality & Tourism",
  "Telecommunications",
  "Logistics & Supply Chain",
  "Government & Public Sector",
  "Manufacturing",
  "Legal & Consulting",
  "Other",
];

export const EXPERIENCE_LEVELS = ["Fresh graduate", "1-2 years", "2-3 years", "3-5 years", "5-10 years", "10+ years"];

export const MARITAL_STATUS_OPTIONS = [
  "Single",
  "Married",
  "Divorced",
  "Separated",
  "Widowed",
  "Prefer not to say",
];

export const WORK_AUTHORIZATION_OPTIONS = [
  "Yes — Saudi citizen",
  "Yes — GCC citizen",
  "Yes — valid Iqama and work permit",
  "Yes — dependent Iqama",
  "No — I require employer sponsorship",
  "Other",
];

export const AVAILABILITY_OPTIONS = [
  "Immediately",
  "2 Weeks Notice",
  "1 Month Notice",
  "2 Months Notice",
  "3 Months Notice",
];

export const MONTHS_LONG = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const EMPTY_FILTERS = {
  locations:       [],
  industries:      [],
  employmentTypes: [],
  experiences:     [],
  salaries:        [],
  genders:         [],
  nationalities:   [],
  freshness:       [],
  sort:            "newest",
};
export const SALARY_RANGES = [
  "Under 5,000 SAR",
  "5,000 – 10,000 SAR",
  "10,000 – 15,000 SAR",
  "15,000 – 20,000 SAR",
  "20,000 – 30,000 SAR",
  "30,000+ SAR",
];
export const JOBS_PER_PAGE = 10;
export const SEARCH_DEBOUNCE_MS = 400;
export const MAX_RESUME_SIZE_BYTES = 5 * 1024 * 1024;
export const RESUME_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export const MAX_VERIFICATION_DOC_SIZE_BYTES = 5 * 1024 * 1024;
export const VERIFICATION_DOC_MIME_TYPES = ["application/pdf"];

export const VERIFICATION_DOCUMENT_TYPES = [
  { value: "REGISTRATION_CERTIFICATE", label: "Company Registration Certificate or equivalent Business Licence" },
  { value: "TAX_REGISTRATION", label: "Company Tax Registration Document (PAN, GST, VAT, EIN, or TIN)" },
  { value: "AUTHORIZED_PERSON_ID", label: "Authorized Person's Government-Issued ID" },
  { value: "ADDRESS_PROOF", label: "Company Address Proof" },
  { value: "AUTHORIZATION_LETTER", label: "Authorization Letter (required if the person submitting the verification is not the owner, director, or registered representative)" },
];

export const SUPPORT_REQUEST_CATEGORIES = [
  { value: "VERIFICATION", label: "Company verification" },
  { value: "PROFILE", label: "Company profile details" },
  { value: "DOCUMENTS", label: "Document upload problem" },
  { value: "ACCOUNT", label: "Employer account access" },
  { value: "OTHER", label: "Other" },
];
