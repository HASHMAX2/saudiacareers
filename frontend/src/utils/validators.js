export const isValidMobile = (value) => /^\+\d{7,15}$/.test(value);

export const isStrongPassword = (value) =>
  typeof value === "string" &&
  value.length >= 8 &&
  /[A-Z]/.test(value) &&
  /\d/.test(value);

const FREE_EMAIL_DOMAINS = new Set([
  "gmail.com","yahoo.com","hotmail.com","outlook.com","icloud.com","live.com",
  "me.com","protonmail.com","aol.com","mail.com","ymail.com","msn.com",
  "yahoo.co.uk","hotmail.co.uk","live.co.uk","proton.me","googlemail.com",
]);

export const isCompanyEmail = (email) => {
  const domain = (email ?? "").split("@")[1]?.toLowerCase();
  return Boolean(domain) && !FREE_EMAIL_DOMAINS.has(domain);
};
