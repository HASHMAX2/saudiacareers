import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { PDFParse } = require("pdf-parse");
const mammoth = require("mammoth");

// ─── Month lookup ──────────────────────────────────────────────────────────────
const MONTH_MAP = {
  jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3,
  apr: 4, april: 4, may: 5, jun: 6, june: 6, jul: 7, july: 7,
  aug: 8, august: 8, sep: 9, sept: 9, september: 9,
  oct: 10, october: 10, nov: 11, november: 11, dec: 12, december: 12,
};

// ─── Section header patterns ───────────────────────────────────────────────────
const SECTION_PATTERNS = [
  { key: "summary",        re: /^(PROFESSIONAL\s+SUMMARY|CAREER\s+(SUMMARY|PROFILE)|SUMMARY|PROFILE|ABOUT\s+ME|CAREER\s+OBJECTIVE|OBJECTIVE)$/ },
  { key: "achievements",   re: /^(NOTABLE\s+ACHIEVEMENTS?|KEY\s+ACHIEVEMENTS?|ACHIEVEMENTS?|ACCOMPLISHMENTS?|HIGHLIGHTS?)$/ },
  { key: "skills",         re: /^(CORE\s+SKILLS?|TECHNICAL\s+SKILLS?|KEY\s+SKILLS?|SKILLS?(\s*((&|AND)\s*)COMPETENCIES)?|COMPETENCIES)$/ },
  { key: "experience",     re: /^(PROFESSIONAL\s+EXPERIENCE|WORK\s+EXPERIENCE|EMPLOYMENT(\s+HISTORY)?|EXPERIENCE|CAREER(\s+HISTORY)?)$/ },
  { key: "education",      re: /^(EDUCATION(\s+(BACKGROUND|QUALIFICATIONS?))?|ACADEMIC\s+(BACKGROUND|QUALIFICATIONS?)|QUALIFICATIONS?)$/ },
  { key: "certifications", re: /^(CERTIFICATIONS?(\s*((&|AND)\s*)(TRAINING|LICEN[SC]ES?))?|CERTIFICATES?|PROFESSIONAL\s+CERTIFICATIONS?)$/ },
  { key: "languages",      re: /^(LANGUAGES?(\s+SKILLS?)?|LANGUAGE\s+PROFICIENC(Y|IES))$/ },
];

const PAGE_BREAK_RE = /^-+\s*\d+\s+of\s+\d+\s*-+$/i;

// ─── Detect section header line ────────────────────────────────────────────────
function detectSection(line) {
  const t = line.trim();
  if (t.length < 3 || t.length > 65) return null;
  if (!/^[A-Z]/.test(t)) return null;
  const letters = t.replace(/[^a-zA-Z]/g, "");
  if (!letters.length) return null;
  const upRatio = (t.match(/[A-Z]/g) || []).length / letters.length;
  if (upRatio < 0.65) return null;
  for (const { key, re } of SECTION_PATTERNS) {
    if (re.test(t)) return key;
  }
  return null;
}

// ─── Split all lines into named sections ──────────────────────────────────────
function splitSections(lines) {
  const out = { header: [] };
  let cur = "header";
  for (const line of lines) {
    const sec = detectSection(line);
    if (sec) {
      cur = sec;
      if (!out[cur]) out[cur] = [];
    } else {
      if (!out[cur]) out[cur] = [];
      out[cur].push(line);
    }
  }
  return out;
}

// ─── Header: name, title, contact, personal info ──────────────────────────────
function parseHeader(lines) {
  const out = {};
  if (!lines.length) return out;

  // Line 0 → full name (title-cased, handles ALL-CAPS resume headers)
  const rawName = lines[0].trim();
  out.name = rawName === rawName.toUpperCase()
    ? rawName.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
    : rawName;

  for (let i = 1; i < Math.min(7, lines.length); i++) {
    const l = lines[i].trim();
    if (!l) continue;

    // Line with pipe-separated titles: "Consultant | Engineer | ..."
    if (i === 1 && l.includes("|") && !l.match(/^\+?\d/) && !l.includes("@")) {
      out.designation = l.split("|")[0].trim();
      out.cvHeadline = l;
      continue;
    }
    // Single-line title (no pipes, no phone, no email)
    if (i === 1 && !l.includes("@") && !l.match(/^\+?\d/) && !l.includes(":")) {
      out.designation = l;
      out.cvHeadline = l;
      continue;
    }

    // Phone: +digits... (international)
    if (!out.alternateMobile) {
      const phone = l.match(/(\+\d[\d\s.\-]{6,18}\d)/);
      if (phone) out.alternateMobile = phone[1].replace(/[\s.\-]/g, "");
    }

    // Email
    if (!out.alternateEmail) {
      const email = l.match(/[\w.+\-]+@[\w.\-]+\.[a-z]{2,}/i);
      if (email) out.alternateEmail = email[0];
    }

    // Nationality, Location, Visa, Notice — pipe-delimited personal info line
    const nat = l.match(/nationality\s*[:\-]\s*([^|,\n]+)/i);
    if (nat) out.nationality = nat[1].trim();

    // Country/city are now fixed dropdowns validated against a bundled country
    // list — a resume can only reliably tell us a Saudi city, so that's the only
    // case mapped automatically. Anything else is left for the candidate to pick.
    const loc = l.match(/location\s*[:\-]\s*([^|,\n(]+)/i);
    if (loc) {
      const raw = loc[1].replace(/open to.*/i, "").trim();
      const lower = raw.toLowerCase();
      if (lower.includes("riyadh")) { out.country = "Saudi Arabia"; out.city = "Riyadh"; }
      else if (lower.includes("jeddah")) { out.country = "Saudi Arabia"; out.city = "Jeddah"; }
      else if (lower.includes("dammam")) { out.country = "Saudi Arabia"; out.city = "Dammam"; }
    }

    const notice = l.match(/notice\s*[:\-]\s*([^|,\n]+)/i);
    if (notice) out.availabilityToJoin = notice[1].trim();
  }

  return out;
}

// ─── Summary section ──────────────────────────────────────────────────────────
function parseSummarySection(lines) {
  const text = lines
    .filter(l => !PAGE_BREAK_RE.test(l))
    .join(" ")
    .replace(/\s{2,}/g, " ")
    .trim();
  return text.slice(0, 2000) || null;
}

// ─── Skills section ───────────────────────────────────────────────────────────
function parseSkillsSection(lines) {
  const mainSkills = [];
  const toolSkills = [];

  // Join lines (wrap-around lines belong to previous category)
  const fullText = lines.join(" ");

  // Split on category labels: word(s) then colon
  // e.g. "Pre-Sales & Consulting: ...", "Tools: ..."
  const blocks = fullText.split(/(?=[A-Z][A-Za-z\s&\/]+:\s)/);

  for (const block of blocks) {
    const colonIdx = block.indexOf(":");
    if (colonIdx === -1) continue;
    const category = block.slice(0, colonIdx).trim();
    const items = block
      .slice(colonIdx + 1)
      .split(/[,]/)
      .map(s => s.trim())
      .filter(s => s.length > 1 && s.length < 80);

    if (/tools?$/i.test(category)) {
      toolSkills.push(...items);
    } else {
      mainSkills.push(...items);
    }
  }

  return {
    skills: mainSkills.length ? mainSkills.slice(0, 30).join(", ") : null,
    itSkills: toolSkills.length ? toolSkills.slice(0, 20).join(", ") : null,
  };
}

// ─── Date string → { month, year, isCurrent } ─────────────────────────────────
function parseDateStr(str) {
  const s = str.trim();
  if (/^present$/i.test(s)) return { month: null, year: null, isCurrent: true };
  const m = s.match(/^(\w+)\s+(\d{4})$/);
  if (m) return { month: MONTH_MAP[m[1].toLowerCase()] ?? null, year: parseInt(m[2]), isCurrent: false };
  const y = s.match(/^(\d{4})$/);
  if (y) return { month: null, year: parseInt(y[1]), isCurrent: false };
  return null;
}

// ─── Employment section ────────────────────────────────────────────────────────
// Each entry: "{Title}\t{MonthYear} – {MonthYear|Present}"  (tab-separated date)
//             "{Company} — {Location}"
//             "• bullet"
const TITLE_DATE_RE = /^(.+?)\t+(\w+\s+\d{4})\s*[–\-—]\s*(\w+\s+\d{4}|[Pp]resent)$/;

function parseExperienceSection(lines) {
  const entries = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();
    if (PAGE_BREAK_RE.test(line)) { i++; continue; }

    const match = line.match(TITLE_DATE_RE);
    if (!match) { i++; continue; }

    const [, rawTitle, startStr, endStr] = match;
    const start = parseDateStr(startStr);
    const end = parseDateStr(endStr);

    const entry = {
      jobTitle: rawTitle.replace(/,\s*$/, "").trim(),
      companyName: "Unknown",
      startMonth: start?.month ?? null,
      startYear: start?.year ?? new Date().getFullYear(),
      endMonth: end?.isCurrent ? null : (end?.month ?? null),
      endYear: end?.isCurrent ? null : (end?.year ?? null),
      isCurrent: end?.isCurrent ?? false,
      description: null,
    };

    i++;

    // Skip blanks then read company line
    while (i < lines.length && lines[i].trim() === "") i++;
    if (i < lines.length) {
      const next = lines[i].trim();
      if (
        !next.startsWith("•") &&
        !next.startsWith("·") &&
        !TITLE_DATE_RE.test(next) &&
        !detectSection(next) &&
        !PAGE_BREAK_RE.test(next)
      ) {
        // Strip trailing " — Location" (em/en-dash only, not hyphens — preserves "Na-Sa Informatics")
        entry.companyName = next.replace(/\s*[—–]\s*.+$/, "").trim() || "Unknown";
        i++;
      }
    }

    // Collect bullet points
    const bullets = [];
    while (i < lines.length) {
      const bl = lines[i].trim();
      if (PAGE_BREAK_RE.test(bl)) { i++; continue; }
      if (bl === "") { i++; continue; }
      if (detectSection(bl)) break;
      if (TITLE_DATE_RE.test(bl)) break;

      if (bl.startsWith("•") || bl.startsWith("·") || bl.startsWith("▪")) {
        bullets.push(bl.replace(/^[•·▪]\s*/, "").trim());
        i++;
      } else {
        // Wrapped continuation of previous bullet
        if (bullets.length > 0) {
          bullets[bullets.length - 1] += " " + bl;
        }
        i++;
      }
    }

    if (bullets.length) {
      entry.description = bullets
        .slice(0, 5)
        .map(b => "• " + b)
        .join("\n")
        .slice(0, 2000);
    }

    if (entry.jobTitle && entry.startYear) entries.push(entry);
  }

  return entries;
}

// ─── Education section ────────────────────────────────────────────────────────
// "B.Tech, Information Technology — Jamia Hamdard University, Delhi\t2011–2015"
function parseEducationSection(lines) {
  const entries = [];

  for (const line of lines) {
    const l = line.trim();
    if (!l || PAGE_BREAK_RE.test(l)) continue;

    // Split off year range (after tab)
    const tabParts = l.split("\t");
    const left = tabParts[0].trim();
    const yearStr = (tabParts[1] || "").trim();

    const yearMatch = yearStr.match(/(\d{4})\s*[–\-—]\s*(\d{4}|[Pp]resent)/);
    const startYear = yearMatch ? parseInt(yearMatch[1]) : null;
    const endYearRaw = yearMatch ? yearMatch[2] : null;
    const isCurrent = !!endYearRaw && /present/i.test(endYearRaw);
    const endYear = isCurrent ? null : (endYearRaw ? parseInt(endYearRaw) : null);

    // Split on " — " to get degree+field vs institution
    const dashIdx = left.indexOf(" — ");
    if (dashIdx === -1) continue; // skip lines without em-dash separator

    const leftPart = left.slice(0, dashIdx).trim();   // "B.Tech, Information Technology"
    const rightPart = left.slice(dashIdx + 3).trim(); // "Jamia Hamdard University, Delhi"

    let degree = leftPart, fieldOfStudy = null;
    const commaIdx = leftPart.indexOf(",");
    if (commaIdx > -1) {
      degree = leftPart.slice(0, commaIdx).trim();
      fieldOfStudy = leftPart.slice(commaIdx + 1).trim() || null;
    }

    // Strip city from institution (last comma-separated part)
    const lastComma = rightPart.lastIndexOf(",");
    const institution = (lastComma > -1 ? rightPart.slice(0, lastComma) : rightPart).trim();

    if (degree && institution) {
      entries.push({ degree, institution, fieldOfStudy, startYear, endYear, isCurrent });
    }
  }

  return entries;
}

// ─── Certifications section ───────────────────────────────────────────────────
// "PMP — Project Management Professional (PMI-2022)"
function parseCertificationsSection(lines) {
  const entries = [];

  for (const line of lines) {
    const l = line.trim();
    if (!l || PAGE_BREAK_RE.test(l) || l.startsWith("•")) continue;

    let name = l, issuingOrg = null, issueYear = null;

    // Extract "(ORG-YEAR)" or "(ORG YEAR)"
    const parenMatch = l.match(/\(([A-Za-z]+[\w\s\-]*?)[-\s](\d{4})\)\s*$/);
    if (parenMatch) {
      issuingOrg = parenMatch[1].trim() || null;
      issueYear = parseInt(parenMatch[2]);
      name = l.slice(0, l.lastIndexOf("(")).trim().replace(/\s*[—–\-]+\s*$/, "").trim();
    }

    if (name) {
      entries.push({ name: name.slice(0, 200), issuingOrg, issueYear });
    }
  }

  return entries;
}

// ─── Languages section ────────────────────────────────────────────────────────
function parseLanguagesSection(lines) {
  const langs = [];
  for (const l of lines) {
    const t = l.trim();
    if (!t || PAGE_BREAK_RE.test(t)) continue;
    // "English (Professional)" → "English"
    const lang = t.replace(/\s*\([^)]+\)/g, "").trim();
    if (lang) langs.push(lang);
  }
  return langs.length ? langs.join(", ") : null;
}

// ─── Calculate total experience years from employment entries ──────────────────
function calcExperienceYears(entries) {
  if (!entries.length) return null;
  const sorted = [...entries].sort((a, b) => a.startYear - b.startYear);
  const earliest = sorted[0].startYear;
  const latest = new Date().getFullYear();
  const years = latest - earliest;
  if (years < 0 || years > 60) return null;
  return String(years);
}

// Fallback: regex on raw text
function parseExperienceFromText(text) {
  const patterns = [
    /(\d+)\+?\s*years?\s*of\s*(professional\s*|work\s*)?experience/i,
    /(\d+)\+?\s*years?\s*experience/i,
    /experience\s*(?:of\s*)?(\d+)\+?\s*years?/i,
    /over\s*(\d+)\s*years?/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) { const y = parseInt(m[1]); if (y >= 0 && y <= 50) return String(y); }
  }
  return null;
}

// ─── Text extraction ──────────────────────────────────────────────────────────
async function extractText(buffer, mimetype) {
  if (mimetype === "application/pdf") {
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    await parser.destroy();
    return result.text;
  }
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

// ─── Main export ──────────────────────────────────────────────────────────────
export async function parseResume(buffer, mimetype) {
  try {
    const text = await extractText(buffer, mimetype);
    const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
    const sections = splitSections(lines);

    const header = parseHeader(sections.header || []);
    const summary = parseSummarySection(sections.summary || []);
    const skillsData = parseSkillsSection(sections.skills || []);
    const employmentEntries = parseExperienceSection(sections.experience || []);
    const educationEntries = parseEducationSection(sections.education || []);
    const certifications = parseCertificationsSection(sections.certifications || []);
    const languagesKnown = parseLanguagesSection(sections.languages || []);

    const experience =
      calcExperienceYears(employmentEntries) || parseExperienceFromText(text);

    return {
      // Flat profile fields
      name: header.name || null,
      designation: header.designation || null,
      cvHeadline: header.cvHeadline || null,
      alternateMobile: header.alternateMobile || null,
      alternateEmail: header.alternateEmail || null,
      nationality: header.nationality || null,
      country: header.country || null,
      city: header.city || null,
      availabilityToJoin: header.availabilityToJoin || null,
      experience,
      skills: skillsData.skills,
      itSkills: skillsData.itSkills,
      summary,
      languagesKnown,
      // Structured arrays (used by controller to create DB records)
      employmentEntries,
      educationEntries,
      certifications,
    };
  } catch (err) {
    console.error("Resume parse error:", err.message);
    return {};
  }
}
