const ADMIN_EMAILS = new Set([
  'crystal@rainbowheart.studio',
  'jonathan@rainbowheart.studio',
])

export function isAdminEmail(email) {
  return ADMIN_EMAILS.has(email?.trim().toLowerCase())
}
