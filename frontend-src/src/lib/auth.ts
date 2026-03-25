import { User, LoginResponse, mapApiUser } from '@/types/auth';
import { apiFetch, setTokens, clearTokens } from '@/lib/api';

const USER_STORAGE_KEY = 'dsi_user';

export async function login(email: string, password: string): Promise<User> {
  const data = await apiFetch<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  setTokens(data.accessToken, data.refreshToken);

  const user = mapApiUser(data.user);
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));

  return user;
}

export async function logout(): Promise<void> {
  try {
    await apiFetch('/auth/logout', { method: 'POST' });
  } catch {
    // Ignore errors on logout
  }
  clearTokens();
}

export function getStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}
