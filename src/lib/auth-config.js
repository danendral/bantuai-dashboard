// Hardcoded credentials — swap this with a DB lookup or Supabase auth later
const USERS = [
  { email: 'admin@gadgetnusa.ai', password: 'Bntu!@9xQ#2026', name: 'Admin', role: 'admin' },
]

export const AUTH_STORAGE_KEY = 'bantuai_auth'

/**
 * Validate email + password against known users.
 * Returns user object (without password) on success, null on failure.
 */
export function validateCredentials(email, password) {
  const user = USERS.find(
    (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
  )
  if (!user) return null
  const { password: _, ...safeUser } = user
  return safeUser
}
