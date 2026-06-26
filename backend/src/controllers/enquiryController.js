import { prisma } from "../config/prisma.js";
import { sendSuccess } from "../utils/ApiResponse.js";

export async function submitEnquiry(req, res) {
  const { name, email, company, subject, message } = req.validated.body;
  await prisma.enquiry.create({ data: { name, email, company, subject, message } });
  return sendSuccess(res, { statusCode: 201, message: "Enquiry submitted successfully" });
}
