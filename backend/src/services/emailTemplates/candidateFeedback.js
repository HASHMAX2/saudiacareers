const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

export const candidateFeedbackEmailTemplate = ({ name, comments, profileUrl }) => ({
  subject: "Feedback on your SaudiaCareers profile",
  html: `<h1>Profile feedback</h1><p>Hello ${escapeHtml(name)},</p><p>Our team reviewed your profile and left the following feedback:</p><p>${escapeHtml(comments).replaceAll("\n", "<br/>")}</p><p><a href="${escapeHtml(profileUrl)}">Update your profile</a></p>`,
});
