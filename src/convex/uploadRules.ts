/**
 * File-upload guardrails for the booking form.
 *
 * The form does not currently accept files, but if an upload input is ever
 * added, enforce these rules server-side: only JPG/PNG images and PDFs are
 * allowed, the file must be 5 MB or smaller, and anything else is rejected
 * before it can be stored or processed.
 *
 * Client-side hint for a future <input type="file"> on the form:
 *   accept=".jpg,.jpeg,.png,.pdf"  (+ a 5 MB size check on change)
 */
export const FORM_FILE_ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "pdf"] as const;
export const FORM_FILE_MAX_BYTES = 5 * 1024 * 1024; // 5 MB

export type FormFileCheck = { ok: true } | { ok: false; message: string };

/**
 * Validates a prospective form file by its file name, size in bytes, and
 * optional MIME type. Returns a clean reject message for disallowed types or
 * oversized files, so callers never surface raw error strings.
 */
export function validateFormFile(
  fileName: string,
  sizeBytes: number,
  contentType?: string,
): FormFileCheck {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  const extAllowed = (
    FORM_FILE_ALLOWED_EXTENSIONS as readonly string[]
  ).includes(ext);
  const typeAllowed =
    !contentType ||
    contentType === "application/pdf" ||
    contentType === "image/jpeg" ||
    contentType === "image/png";

  if (!extAllowed || !typeAllowed) {
    return { ok: false, message: "Only JPG, PNG, or PDF files are allowed." };
  }
  if (sizeBytes <= 0 || sizeBytes > FORM_FILE_MAX_BYTES) {
    return { ok: false, message: "Files must be 5 MB or smaller." };
  }
  return { ok: true };
}
