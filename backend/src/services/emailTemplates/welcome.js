export const welcomeEmailTemplate = ({ name }) => ({
  subject: "Welcome to SaudiaCareers",
  html: `<h1>Welcome to SaudiaCareers</h1><p>Hello ${escapeHtml(name)}, your account is ready.</p>`,
});

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

