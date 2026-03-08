export type Role = 'admin' | 'user'

const ROLE_KEY = 'coursebook_role'

const PASSWORDS: Record<Role, string> = {
  admin: 'admin123',
  user: 'user123',
}

export const getRole = (): Role | null => {
  const raw = localStorage.getItem(ROLE_KEY)
  if (raw === 'admin' || raw === 'user') {
    return raw
  }
  return null
}

export const login = (role: Role, password: string) => {
  if (PASSWORDS[role] !== password) {
    return false
  }
  localStorage.setItem(ROLE_KEY, role)
  return true
}

export const logout = () => {
  localStorage.removeItem(ROLE_KEY)
}