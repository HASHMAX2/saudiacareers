const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

export const applicationStatusEmailTemplate = ({ name, jobTitle, status }) => ({
  subject: "Your application status has been updated",
  html: `<h1>Application update</h1><p>Hello ${escapeHtml(name)}, your application for <strong>${escapeHtml(jobTitle)}</strong> is now <strong>${escapeHtml(status.replaceAll("_", " "))}</strong>.</p>`,
});

