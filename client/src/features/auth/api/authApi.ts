const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  farmer: {
    id: string;
    name: string;
    phone_number: string;
    preferred_language: string;
  };
}

async function apiFetch(path: string, options: RequestInit = {}): Promise<any> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message ?? `Request failed: ${res.status}`);
  }
  return data;
}

export const authApi = {
  requestOtp: (phoneNumber: string) =>
    apiFetch('/auth/request-otp', {
      method: 'POST',
      body: JSON.stringify({ phone_number: phoneNumber }),
    }),

  verifyOtp: (phoneNumber: string, code: string): Promise<AuthTokens> =>
    apiFetch('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phone_number: phoneNumber, code }),
    }),

  refresh: (refreshToken: string): Promise<AuthTokens> =>
    apiFetch('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    }),

  logout: (accessToken: string, refreshToken?: string) =>
    apiFetch('/auth/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ refresh_token: refreshToken }),
    }),

  me: (accessToken: string) =>
    apiFetch('/auth/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    }),
};
