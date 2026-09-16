const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api";

async function apiFetch(path, options = {}) {
  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
  } catch (err) {
    if (err.name === "TypeError" && err.message.toLowerCase().includes("fetch")) {
      throw new Error("Unable to connect to backend server. Please verify the server is running on port 8000.");
    }
    throw err;
  }
  
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch (e) {
    throw new Error(`API Error (${res.status}): Expected JSON but got: ${text.slice(0, 50)}...`);
  }
  
  if (!res.ok) {
    throw new Error(data?.error?.message ?? data?.message ?? `Request failed: ${res.status}`);
  }
  return data;
}

export const authApi = {
  requestOtp: (identifier) =>
    apiFetch("/auth/request-otp", {
      method: "POST",
      body: JSON.stringify({ identifier }),
    }),

  loginWithGoogle: (accessToken) =>
    apiFetch("/auth/login/google", {
      method: "POST",
      body: JSON.stringify({ access_token: accessToken }),
    }),

  login: (email, password) =>
    apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  verifyOtp: (identifier, code) =>
    apiFetch("/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify({ identifier, code }),
    }),

  register: (name, email, password, phone_number) =>
    apiFetch("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password, phone_number }),
    }),

  forgotPassword: (email) =>
    apiFetch("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  resetPassword: (email, code, new_password) =>
    apiFetch("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ email, code, new_password }),
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
