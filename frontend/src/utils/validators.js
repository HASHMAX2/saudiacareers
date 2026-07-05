import { parsePhone } from "./countryCodes.js";

// Valid if: format is +[7-15 digits] AND the local part (after the country code) is ≥ 6 digits.
// Minimum 6 local digits covers the shortest real mobile numbers on Earth (some Pacific island networks).
// This rules out numbers like +9661234 (+966 code + only 4 local digits) that pass a naive length check.
export const isValidMobile = (value) => {
  if (!value || !/^\+\d{7,15}$/.test(value)) return false;
  const { digits } = parsePhone(value);
  return digits.length >= 6;
};

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
