export const passwordResetEmailTemplate = ({ name, resetUrl }) => ({
  subject: "Reset your SaudiaCareers password",
  html: `<h1>Password reset</h1><p>Hello ${escapeHtml(name)},</p><p><a href="${escapeHtml(resetUrl)}">Reset your password</a>. This link expires in one hour.</p>`,
});

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

