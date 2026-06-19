const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

export const applicationEmailTemplate = ({ job, candidate, profile }) => ({
  subject: `Application for ${job.title} – ${candidate.name}`,
  html: `
    <h1>New application: ${escapeHtml(job.title)}</h1>
    <p><strong>Name:</strong> ${escapeHtml(candidate.name)}</p>
    <p><strong>Email:</strong> ${escapeHtml(candidate.email)}</p>
    <p><strong>Mobile:</strong> ${escapeHtml(candidate.mobile)}</p>
    <p><strong>Experience:</strong> ${escapeHtml(profile.experience)}</p>
    <p><strong>Skills:</strong> ${escapeHtml(profile.skills)}</p>
    <p><strong>Summary:</strong> ${escapeHtml(profile.summary || "Not provided")}</p>
  `,
});

