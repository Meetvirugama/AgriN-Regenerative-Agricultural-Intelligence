import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authApi, AuthTokens } from '../api/authApi';

interface AuthFarmer {
  id: string;
  name: string;
  phone_number: string;
  preferred_language: string;
}

interface AuthContextValue {
  farmer: AuthFarmer | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  requestOtp: (phoneNumber: string) => Promise<void>;
  verifyOtp: (phoneNumber: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  farmer: null,
  accessToken: null,
  isLoading: true,
  isAuthenticated: false,
  requestOtp: async () => {},
  verifyOtp: async () => {},
  logout: async () => {},
});

const STORAGE_KEY = 'agri_auth';

interface StoredSession {
  accessToken: string;
  refreshToken: string;
  farmer: AuthFarmer;
}

function loadSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveSession(session: StoredSession) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

function clearSession() {
  localStorage.removeItem(STORAGE_KEY);
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [farmer, setFarmer] = useState<AuthFarmer | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ─── Restore session on app boot ────────────────────────────────────────
  useEffect(() => {
    const session = loadSession();
    if (!session) {
      setIsLoading(false);
      return;
    }

    // Try to refresh the access token — if it's expired or invalid, silently log out
    authApi.refresh(session.refreshToken)
      .then((tokens: AuthTokens) => {
        const newSession: StoredSession = {
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
  const requestOtp = useCallback(async (phoneNumber: string) => {
    await authApi.requestOtp(phoneNumber);
  }, []);

  // ─── Verify OTP and log in ────────────────────────────────────────────────
  const verifyOtp = useCallback(async (phoneNumber: string, code: string) => {
    const tokens = await authApi.verifyOtp(phoneNumber, code);
    const session: StoredSession = {
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
