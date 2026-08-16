import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { authApi } from "../api/authApi";

const AuthContext = createContext({
  farmer: null,
  accessToken: null,
  isLoading: true,
  isAuthenticated: false,
  requestOtp: async () => {},
  verifyOtp: async () => {},
  logout: async () => {},
});

const STORAGE_KEY = "agri_auth";

function loadSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveSession(session) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

function clearSession() {
  localStorage.removeItem(STORAGE_KEY);
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [farmer, setFarmer] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // ─── Restore session on app boot ────────────────────────────────────────
  useEffect(() => {
    const session = loadSession();
    if (!session) {
      setIsLoading(false);
      return;
    }

    // Try to refresh the access token — if it's expired or invalid, silently log out
    authApi
      .refresh(session.refreshToken)
      .then((tokens) => {
        const newSession = {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          farmer: tokens.farmer,
        };
        saveSession(newSession);
        setAccessToken(tokens.accessToken);
        setFarmer(tokens.farmer);
      })
      .catch(() => {
        // Refresh failed — session expired, require re-login
        clearSession();
      })
      .finally(() => setIsLoading(false));
  }, []);

  // ─── Request OTP ─────────────────────────────────────────────────────────
  const requestOtp = useCallback(async (phoneNumber) => {
    await authApi.requestOtp(phoneNumber);
  }, []);

  // ─── Verify OTP and log in ────────────────────────────────────────────────
  const verifyOtp = useCallback(async (phoneNumber, code) => {
    const tokens = await authApi.verifyOtp(phoneNumber, code);
    const session = {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      farmer: tokens.farmer,
    };
    saveSession(session);
    setAccessToken(tokens.accessToken);
    setFarmer(tokens.farmer);
  }, []);

  // ─── Logout ───────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    const session = loadSession();
    if (session) {
      try {
        await authApi.logout(session.accessToken, session.refreshToken);
      } catch {
        // Best-effort — clear local state regardless
      }
    }
    clearSession();
    setAccessToken(null);
    setFarmer(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        farmer,
        accessToken,
        isLoading,
        isAuthenticated: !!farmer,
        requestOtp,
        verifyOtp,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
