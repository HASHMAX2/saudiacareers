export const isValidMobile = (value) => /^\+\d{7,15}$/.test(value);

export const isStrongPassword = (value) =>
  typeof value === "string" &&
  value.length >= 8 &&
  /[A-Z]/.test(value) &&
  /\d/.test(value);
