import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are a job-data extraction assistant. Extract structured job listings from raw WhatsApp recruitment messages.

RULES:
1. Create one object per ROLE. If a message lists multiple roles (e.g. "Arabic Teacher" and "Qudrat Trainer"), produce a separate object for each.
2. If the same role is offered in multiple cities in one message (e.g. Riyadh / Jeddah / Dammam), produce a separate object for each city.
3. Location mapping — map to EXACTLY one of: "Riyadh", "Jeddah", "Dammam", "Other":
   - Riyadh / Riyad / East Riyadh / Al-Riyadh → "Riyadh"
   - Jeddah / Jidda / Jidah → "Jeddah"
   - Dammam / Khobar / Al-Khobar / Dhahran / Eastern Province → "Dammam"
   - Anything else → "Other"
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
15. Return ONLY a valid JSON array — no explanation text, no markdown fences, no preamble.`;

export async function parseJobsFromWhatsApp(rawText) {
  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Extract all job listings from the following WhatsApp messages and return a JSON array.\n\nEach object must have exactly these fields: title, companyName, location, industry, employmentType, experienceRequired, salaryRange, description, requiredSkills, hrEmail, applicationDeadline.\n\n--- MESSAGES START ---\n${rawText}\n--- MESSAGES END ---`,
      },
    ],
  });

  let raw = message.content[0].text.trim();
  // Strip markdown code fences if the model wraps output
  raw = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");

  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) throw new Error("AI did not return a JSON array");
  return parsed;
}
