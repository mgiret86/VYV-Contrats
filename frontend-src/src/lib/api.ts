const API_BASE = import.meta.env.VITE_API_URL || '/api';

let accessToken: string | null = localStorage.getItem('dsi_access_token');
let refreshToken: string | null = localStorage.getItem('dsi_refresh_token');

// ===== Token management =====

export function setTokens(access: string, refresh: string) {
  accessToken = access;
  refreshToken = refresh;
  localStorage.setItem('dsi_access_token', access);
  localStorage.setItem('dsi_refresh_token', refresh);
}

export function clearTokens() {
  accessToken = null;
  refreshToken = null;
  localStorage.removeItem('dsi_access_token');
  localStorage.removeItem('dsi_refresh_token');
  localStorage.removeItem('dsi_user');
}

export function getAccessToken() {
  return accessToken;
}

// ===== Refresh logic =====

let refreshPromise: Promise<boolean> | null = null;

async function doRefresh(): Promise<boolean> {
  if (!refreshToken) return false;
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    setTokens(data.accessToken, data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

async function tryRefresh(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = doRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

// ===== Main fetch wrapper =====

export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };

  // Don't set Content-Type for FormData (browser sets boundary automatically)
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  let res = await fetch(url, { ...options, headers });

  // If 401, try refresh and retry once
  if (res.status === 401 && refreshToken) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      headers['Authorization'] = `Bearer ${accessToken}`;
      res = await fetch(url, { ...options, headers });
    }
  }

  if (res.status === 401) {
    clearTokens();
    window.location.href = '/login';
    throw new Error('Session expirée');
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Erreur ${res.status}`);
  }

  // Handle empty responses (204 No Content)
  if (res.status === 204) return {} as T;

  return res.json();
}
