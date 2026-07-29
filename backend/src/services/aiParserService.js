import Anthropic from "@anthropic-ai/sdk";
import { normalizeJobLocation } from "../utils/locationNormalizer.js";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are a job-data extraction assistant. Extract structured job listings from raw WhatsApp recruitment messages.

RULES:
1. Create one object per ROLE. If a message lists multiple roles (e.g. "Arabic Teacher" and "Qudrat Trainer"), produce a separate object for each.
2. If the same role is offered in multiple cities in one message (e.g. Riyadh / Jeddah / Dammam), produce a separate object for each city.
3. Location mapping — map to EXACTLY one of: "Riyadh", "Jeddah", "Mecca", "Medina", "Dammam", "Khobar", "Dhahran", "Jubail", "Taif", "Abha", "Khamis Mushait", "Najran", "Jizan", "Tabuk", "Hail", "Buraidah", "Al Kharj", "Hafar Al-Batin", "Yanbu", "Al Ahsa", "Qatif", "Arar", "Sakaka", "Other":
   - Riyadh / Riyad / East Riyadh / Al-Riyadh → "Riyadh"
   - Jeddah / Jidda / Jidah → "Jeddah"
   - Mecca / Makkah → "Mecca"
   - Medina / Madinah / Al-Madinah → "Medina"
   - Dammam → "Dammam"
   - Khobar / Al-Khobar → "Khobar"
   - Dhahran → "Dhahran"
   - Jubail / Al-Jubail → "Jubail"
   - Hofuf / Al-Hasa / Al-Ahsa → "Al Ahsa"
   - Any other named Saudi city not in this list, or anything not clearly a Saudi city (e.g. remote, unspecified) → "Other"
4. hrEmail: extract valid email addresses only. If multiple, use the FIRST one. If only WhatsApp numbers (no email), set hrEmail to "".
5. requiredSkills: comma-separated string of skills/qualifications inferred from requirements bullets. Be concise (e.g. "English proficiency, Teaching experience, Communication skills").
6. experienceRequired: e.g. "2+ years", "Fresh graduate", "3-5 years". If not specified, write "Not specified".
7. employmentType: one of "Full-time", "Part-time", "Contract", "Internship". Default to "Full-time" if not mentioned.
8. industry: infer from context. Use ONE of: "Education", "Healthcare", "Technology", "Finance", "Engineering", "Retail", "Hospitality", "Construction", "Marketing", "Administration", "Other".
9. description: write a clean 2-4 sentence summary of the role using the requirements text. Do NOT include emojis.
10. salaryRange: empty string "" if not mentioned.
11. applicationDeadline: empty string "" if not mentioned.
12. companyName: extract school/company name if clearly stated. Empty string "" if unknown.
13. Strip ALL emoji characters from every field value.
14. Ignore sender names, timestamps, and forwarding metadata at the top of messages.
15. Never invent a value that is not stated or clearly implied in the source text. When genuinely unsure, use the field's documented empty/fallback value ("", "Not specified", or "Other") rather than guessing — a missing field is far better than a fabricated one.
16. Call the extract_jobs tool exactly once with every job you found. If no job postings are present, call it with an empty jobs array.`;

const JOB_ITEM_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    companyName: { type: "string" },
    location: {
      type: "string",
      enum: [
        "Riyadh", "Jeddah", "Mecca", "Medina", "Dammam", "Khobar", "Dhahran", "Jubail",
        "Taif", "Abha", "Khamis Mushait", "Najran", "Jizan", "Tabuk", "Hail", "Buraidah",
        "Al Kharj", "Hafar Al-Batin", "Yanbu", "Al Ahsa", "Qatif", "Arar", "Sakaka", "Other",
      ],
    },
    industry: { type: "string" },
    employmentType: { type: "string", enum: ["Full-time", "Part-time", "Contract", "Internship"] },
    experienceRequired: { type: "string" },
    salaryRange: { type: "string" },
    description: { type: "string" },
    requiredSkills: { type: "string" },
    hrEmail: { type: "string" },
    applicationDeadline: { type: "string" },
  },
  // Every key must be present in the model's output (each can still be an empty
  // string per the prompt's fallback rules) — this is what actually prevents the
  // "AI silently omits a field" failure mode, rather than just asking nicely.
  required: [
    "title", "companyName", "location", "industry", "employmentType",
    "experienceRequired", "salaryRange", "description", "requiredSkills",
    "hrEmail", "applicationDeadline",
  ],
};

const EXTRACT_JOBS_TOOL = {
  name: "extract_jobs",
  description: "Record every job listing extracted from the WhatsApp messages.",
  input_schema: {
    type: "object",
    properties: {
      jobs: { type: "array", items: JOB_ITEM_SCHEMA },
    },
    required: ["jobs"],
  },
};

async function callModel(rawText) {
  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    tools: [EXTRACT_JOBS_TOOL],
    tool_choice: { type: "tool", name: "extract_jobs" },
    messages: [
      {
        role: "user",
        content: `Extract all job listings from the following WhatsApp messages.\n\n--- MESSAGES START ---\n${rawText}\n--- MESSAGES END ---`,
      },
    ],
  });

  const toolUse = message.content.find((block) => block.type === "tool_use" && block.name === "extract_jobs");
  if (!toolUse) throw new Error("AI did not return a structured extraction result");

  const jobs = toolUse.input?.jobs;
  if (!Array.isArray(jobs)) throw new Error("AI result did not include a jobs array");
  return jobs;
}

export async function parseJobsFromWhatsApp(rawText) {
  let jobs;
  try {
    jobs = await callModel(rawText);
  } catch (error) {
    // One retry for transient issues (rate limits, network blips, or the rare
    // malformed tool call) — not a fix for bad input, just resilience against
    // the AI call itself failing outright and losing the whole batch.
    console.error("AI import parse attempt 1 failed, retrying once:", error.message);
    jobs = await callModel(rawText);
  }
  // Safety net, not the primary defense — the tool schema's enum already
  // constrains the model's output, this just guards against the rare
  // non-conformant response instead of trusting it blindly.
  return jobs.map((job) => ({ ...job, location: normalizeJobLocation(job.location) }));
}
