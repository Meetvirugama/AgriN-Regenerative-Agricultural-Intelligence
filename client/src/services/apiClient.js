/**
 * Unified API Client
 *
 * Replaces direct fetch() calls across the app to ensure consistent
 * base URL resolution, JSON parsing, and error handling.
 */

export const API_BASE = (() => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) {
    return envUrl.endsWith('/v1') ? envUrl : `${envUrl}/v1`;
  }
  return "http://localhost:8000/api/v1";
})();

export class ApiError extends Error {
  constructor(message, status, data) {
    const msgStr = typeof message === "string" 
      ? message 
      : (message?.message || JSON.stringify(message) || "Unknown Error");
    super(msgStr);
    this.status = status;
    this.data = data;
    this.name = "ApiError";
  }
}

export async function request(path, options = {}) {
  // Normalize path to not start with '/' if API_BASE doesn't end with it
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${API_BASE}${cleanPath}`;

  const headers = new Headers(options.headers || {});
  // Set default JSON headers unless we're sending FormData
  if (!(options.body instanceof FormData)) {
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    if (!headers.has("Accept")) {
      headers.set("Accept", "application/json");
    }
  }

  // Automatically attach auth token if available
  if (!headers.has("Authorization")) {
    try {
      const raw = localStorage.getItem("agri_auth");
      if (raw) {
        const session = JSON.parse(raw);
        if (session?.accessToken) {
          headers.set("Authorization", `Bearer ${session.accessToken}`);
        }
      }
    } catch {
      // Ignore JSON parse errors
    }
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);

    // Handle 204 No Content
    if (response.status === 204) {
      return {};
    }

    let data;
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      throw new ApiError(
        data?.error ||
          data?.message ||
          `Request failed with status ${response.status}`,
        response.status,
        data,
      );
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    // Handle network errors (offline, CORS, etc.)
    throw new Error(error instanceof Error ? error.message : "Network error");
  }
}
