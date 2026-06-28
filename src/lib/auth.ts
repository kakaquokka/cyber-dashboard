export const PASSWORD_KEY = 'dashboard_authed';

export function isAuthed(): boolean {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem(PASSWORD_KEY) === 'true';
}

export function login(password: string): boolean {
  const correct = process.env.NEXT_PUBLIC_DASHBOARD_PASSWORD;
  if (!correct) return false;
  if (password === correct) {
    sessionStorage.setItem(PASSWORD_KEY, 'true');
    return true;
  }
  return false;
}

export function logout(): void {
  sessionStorage.removeItem(PASSWORD_KEY);
}