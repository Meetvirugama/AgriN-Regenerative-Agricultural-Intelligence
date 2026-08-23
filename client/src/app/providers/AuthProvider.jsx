import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { authApi } from "../../features/auth/api/authApi";

const AuthContext = createContext({
  farmer: null,
  accessToken: null,
  isLoading: true,
  isAuthenticated: false,
  requestOtp: async () => {},
  verifyOtp: async () => {},
  loginWithEmail: async () => {},
  register: async () => {},
  forgotPassword: async () => {},
  resetPassword: async () => {},
  loginWithGoogle: async () => {},
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
  const requestOtp = useCallback(async (identifier) => {
    await authApi.requestOtp(identifier);
  }, []);

  // ─── Verify OTP and log in ────────────────────────────────────────────────
  const verifyOtp = useCallback(async (identifier, code) => {
    const tokens = await authApi.verifyOtp(identifier, code);
    const session = {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      farmer: tokens.farmer,
    };
    saveSession(session);
    setAccessToken(tokens.accessToken);
    setFarmer(tokens.farmer);
  }, []);

  // ─── Email Login / Registration ──────────────────────────────────────────
  const loginWithEmail = useCallback(async (email, password) => {
    const tokens = await authApi.login(email, password);
    const session = {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      farmer: tokens.farmer,
    };
    saveSession(session);
    setAccessToken(tokens.accessToken);
    setFarmer(tokens.farmer);
  }, []);

  const register = useCallback(async (name, email, password, phoneNumber) => {
    const tokens = await authApi.register(name, email, password, phoneNumber);
    
    // Set is_new_user flag if not present
    sessionStorage.setItem("agri_is_new_user", "true");
    
    const farmerObj = {
      ...tokens.farmer,
      is_new_user: true,
    };
    
    const session = {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      farmer: farmerObj,
    };
    
    saveSession(session);
    setAccessToken(session.accessToken);
    setFarmer(farmerObj);
  }, []);

  const forgotPassword = useCallback(async (email) => {
    await authApi.forgotPassword(email);
  }, []);

  const resetPassword = useCallback(async (email, code, newPassword) => {
    await authApi.resetPassword(email, code, newPassword);
  }, []);

  const loginWithGoogle = useCallback(async (tokenResponse) => {
    try {
      const tokens = await authApi.loginWithGoogle(tokenResponse.access_token);
      
      const isNewUser = Boolean(tokens.is_new_user || tokens.farmer?.is_new_user);
      if (isNewUser) {
        sessionStorage.setItem("agri_is_new_user", "true");
      }

      const farmerObj = {
        ...tokens.farmer,
        is_new_user: isNewUser,
      };

      const session = {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        farmer: farmerObj,
      };
      
      saveSession(session);
      setAccessToken(session.accessToken);
      setFarmer(farmerObj);
      return tokens;
    } catch (err) {
      console.error("Failed to login with Google via backend", err);
      throw err;
    }
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
        loginWithEmail,
        register,
        forgotPassword,
        resetPassword,
        loginWithGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
