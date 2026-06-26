export const LOCATIONS = ["Riyadh", "Jeddah", "Dammam", "Other"];

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

