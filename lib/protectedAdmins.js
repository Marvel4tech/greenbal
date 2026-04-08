export const PROTECTED_SUPER_ADMIN_EMAILS = [
    "marvel4tech@gmail.com",
    "corporate@greenball360.com",
  ].map((email) => email.toLowerCase());
  
  export function isProtectedSuperAdminEmail(email) {
    return PROTECTED_SUPER_ADMIN_EMAILS.includes(String(email || "").toLowerCase());
  }