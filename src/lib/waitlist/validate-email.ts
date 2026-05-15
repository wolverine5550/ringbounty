/** Pragmatic email validation for server-side forms (§2.8.3). */
const EMAIL_PATTERN =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MAX_EMAIL_LENGTH = 320;

export function validateEmail(raw: string): { ok: true; email: string } | { ok: false; error: string } {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: false, error: "Email is required." };
  }
  if (trimmed.length > MAX_EMAIL_LENGTH) {
    return { ok: false, error: "Email is too long." };
  }
  if (!EMAIL_PATTERN.test(trimmed)) {
    return { ok: false, error: "Enter a valid email address." };
  }
  return { ok: true, email: trimmed };
}
