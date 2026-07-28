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
