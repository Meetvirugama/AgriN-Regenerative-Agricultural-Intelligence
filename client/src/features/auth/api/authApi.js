const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api";

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
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
  requestOtp: (phoneNumber) =>
    apiFetch("/auth/request-otp", {
      method: "POST",
      body: JSON.stringify({ phone_number: phoneNumber }),
    }),

  login: (email, password) =>
    apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  verifyOtp: (phoneNumber, code) =>
    apiFetch("/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify({ phone_number: phoneNumber, code }),
    }),

  refresh: (refreshToken) =>
    apiFetch("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refresh_token: refreshToken }),
    }),

  logout: (accessToken, refreshToken) =>
    apiFetch("/auth/logout", {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ refresh_token: refreshToken }),
    }),

  me: (accessToken) =>
    apiFetch("/auth/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    }),
};
