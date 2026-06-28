export const PASSWORD_KEY = 'dashboard_authed';

export function isAuthed(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(PASSWORD_KEY) === 'true';
  } catch {
    return false;
  }
}

export function login(password: string): boolean {
  const correct = process.env.NEXT_PUBLIC_DASHBOARD_PASSWORD;
  if (!correct) return false;
  if (password === correct) {
    try {
      localStorage.setItem(PASSWORD_KEY, 'true');
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

export function logout(): void {
  try {
    localStorage.removeItem(PASSWORD_KEY);
  } catch { /* ignore */ }
}