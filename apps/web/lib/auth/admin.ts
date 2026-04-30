const ADMIN_EMAILS = new Set(["jorge@rojas.me"]);

export function isAdmin(email: string | undefined | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.has(email.toLowerCase());
}
