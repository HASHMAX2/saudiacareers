// Mirrors frontend/src/utils/constants.js's LOCATIONS — kept in sync manually
// since there's no shared package between the two apps. Used to normalize
// free-text location values coming from bulk import sources (Excel rows,
// and as a safety net on the AI parser's output) so they always land on one
// of the dropdown's canonical values instead of silently failing to match.
export const JOB_LOCATIONS = [
  "Riyadh", "Jeddah", "Mecca", "Medina", "Dammam", "Khobar", "Dhahran", "Jubail",
  "Taif", "Abha", "Khamis Mushait", "Najran", "Jizan", "Tabuk", "Hail", "Buraidah",
  "Al Kharj", "Hafar Al-Batin", "Yanbu", "Al Ahsa", "Qatif", "Arar", "Sakaka", "Other",
];

// Alias key → canonical LOCATIONS value. Keys are matched after normalizing
// (lowercased, punctuation stripped, whitespace collapsed).
const ALIASES = {
  riyadh: "Riyadh", alriyadh: "Riyadh", arriyadh: "Riyadh",
  jeddah: "Jeddah", jiddah: "Jeddah", jedda: "Jeddah", jidda: "Jeddah",
  mecca: "Mecca", makkah: "Mecca", makkahalmukarramah: "Mecca", mekkah: "Mecca",
  medina: "Medina", madinah: "Medina", almadinah: "Medina", medinah: "Medina",
  dammam: "Dammam", addammam: "Dammam", aldammam: "Dammam",
  khobar: "Khobar", alkhobar: "Khobar",
  dhahran: "Dhahran", azzahran: "Dhahran",
  jubail: "Jubail", aljubail: "Jubail",
  taif: "Taif", attaif: "Taif", altaif: "Taif",
  abha: "Abha",
  khamismushait: "Khamis Mushait", khamismushayt: "Khamis Mushait",
  najran: "Najran",
  jizan: "Jizan", jazan: "Jizan",
  tabuk: "Tabuk",
  hail: "Hail", hayil: "Hail",
  buraidah: "Buraidah", buraydah: "Buraidah", qassim: "Buraidah", alqassim: "Buraidah",
  alkharj: "Al Kharj", kharj: "Al Kharj",
  hafaralbatin: "Hafar Al-Batin", hafralbatin: "Hafar Al-Batin",
  yanbu: "Yanbu", yanbualbahr: "Yanbu",
  alahsa: "Al Ahsa", alhasa: "Al Ahsa", hofuf: "Al Ahsa",
  qatif: "Qatif", alqatif: "Qatif",
  arar: "Arar",
  sakaka: "Sakaka",
  other: "Other",
};

function normalizeKey(value) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFKD").replace(/[̀-ͯ]/g, "") // strip accents
    .replace(/[^a-z]/g, ""); // keep letters only — drops spaces, hyphens, commas
}

// Best-effort mapping of a free-text location to one of the 23 canonical
// Saudi cities (or "Other"). Never returns an unrecognized value, so a
// bulk-imported job's location always lands on something the JobForm
// dropdown can actually select.
export function normalizeJobLocation(raw) {
  const trimmed = String(raw ?? "").trim();
  if (!trimmed) return "";

  const key = normalizeKey(trimmed);
  if (ALIASES[key]) return ALIASES[key];

  // Loose fallback: the raw text contains a known city name somewhere in it
  // (e.g. "Khobar, Eastern Province" or "Riyadh - Head Office").
  for (const [aliasKey, canonical] of Object.entries(ALIASES)) {
    if (aliasKey.length >= 4 && key.includes(aliasKey)) return canonical;
  }

  return "Other";
}
