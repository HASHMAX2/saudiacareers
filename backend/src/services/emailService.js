import { Resend } from "resend";
import { env } from "../config/env.js";

let resendClient;

function getClient() {
  if (!env.RESEND_API_KEY) return null;
  resendClient ??= new Resend(env.RESEND_API_KEY);
  return resendClient;
}

export async function sendEmail({ to, subject, html, attachments }) {
  const client = getClient();

  if (!client) {
    if (env.isProduction) {
      throw new Error("RESEND_API_KEY is required in production");
    }
    console.info(`[email skipped] ${subject} -> ${to}`);
    return { skipped: true };
  }

  const { data, error } = await client.emails.send({
    from: env.RESEND_FROM_EMAIL,
    to,
    subject,
    html,
    ...(attachments ? { attachments } : {}),
  });

  if (error) throw new Error(error.message);
  return data;
}

