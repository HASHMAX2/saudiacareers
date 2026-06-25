import { parseJobsFromWhatsApp } from "../services/aiParserService.js";
import { ApiError } from "../utils/ApiError.js";
import { sendSuccess } from "../utils/ApiResponse.js";

export async function parseImport(req, res) {
  const text = req.body?.text;
  if (!text?.trim()) throw new ApiError(400, "No text provided.");
  if (text.length > 60000) throw new ApiError(400, "Text too long — max 60,000 characters.");

  const jobs = await parseJobsFromWhatsApp(text.trim());

  return sendSuccess(res, {
    message: `Parsed ${jobs.length} job(s) from messages`,
    data: { jobs, count: jobs.length },
  });
}
