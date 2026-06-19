export const isSaudiMobile = (value) => /^\+966\d{9}$/.test(value);

export const isStrongPassword = (value) =>
  typeof value === "string" &&
  value.length >= 8 &&
  /[A-Z]/.test(value) &&
  /\d/.test(value);

