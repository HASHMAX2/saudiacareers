export const LOCATIONS = ["Riyadh", "Jeddah", "Dammam", "Other"];

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
