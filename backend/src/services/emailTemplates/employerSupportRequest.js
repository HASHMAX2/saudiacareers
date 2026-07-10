const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const CATEGORY_LABELS = {
  VERIFICATION: "Company verification",
  PROFILE: "Company profile details",
  DOCUMENTS: "Document upload problem",
  ACCOUNT: "Employer account access",
  OTHER: "Other",
};

export const employerSupportRequestEmailTemplate = ({ companyName, contactName, contactEmail, category, subject, message }) => ({
  subject: `[Employer support] ${subject}`,
  html: `<h1>Employer support request</h1>
    <p><strong>Company:</strong> ${escapeHtml(companyName)}</p>
    <p><strong>Contact:</strong> ${escapeHtml(contactName)} (${escapeHtml(contactEmail)})</p>
    <p><strong>Category:</strong> ${escapeHtml(CATEGORY_LABELS[category] ?? category)}</p>
    <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
    <p>${escapeHtml(message).replaceAll("\n", "<br/>")}</p>`,
});
