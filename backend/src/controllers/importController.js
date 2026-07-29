import { parseJobsFromWhatsApp } from "../services/aiParserService.js";
import { parseJobsFromExcel } from "../services/jobExcelImportService.js";
import { isXlsxBuffer } from "../utils/fileSignature.js";
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

export async function parseExcelImport(req, res) {
  if (!req.file) throw new ApiError(422, "No file uploaded");
  if (!isXlsxBuffer(req.file.buffer)) throw new ApiError(422, "File must be a valid Excel .xlsx spreadsheet");

  let jobs;
  try {
    jobs = parseJobsFromExcel(req.file.buffer);
  } catch (error) {
    throw new ApiError(422, error.message || "Unable to read the spreadsheet");
  }

  return sendSuccess(res, {
    message: `Parsed ${jobs.length} job(s) from spreadsheet`,
    data: { jobs, count: jobs.length },
  });
}
