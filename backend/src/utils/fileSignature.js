// Multer's fileFilter only sees the client-declared Content-Type header, not
// the actual bytes (the buffer isn't populated yet at that point in the
// multipart stream) — so a file relabeled with a spoofed header sails through
// fileFilter unchecked (SA-04). This checks the real magic bytes once the
// buffer is available, for endpoints (like KYB verification uploads) that
// only ever accept one specific format.
const PDF_SIGNATURE = Buffer.from("%PDF-", "ascii");

export function isPdfBuffer(buffer) {
  return Buffer.isBuffer(buffer) && buffer.length >= PDF_SIGNATURE.length && buffer.subarray(0, PDF_SIGNATURE.length).equals(PDF_SIGNATURE);
}

// .xlsx is a ZIP container, so it always starts with the ZIP local-file-header
// signature — same spoofed-Content-Type concern as isPdfBuffer above.
const ZIP_SIGNATURE = Buffer.from([0x50, 0x4b, 0x03, 0x04]);

export function isXlsxBuffer(buffer) {
  return Buffer.isBuffer(buffer) && buffer.length >= ZIP_SIGNATURE.length && buffer.subarray(0, ZIP_SIGNATURE.length).equals(ZIP_SIGNATURE);
}
