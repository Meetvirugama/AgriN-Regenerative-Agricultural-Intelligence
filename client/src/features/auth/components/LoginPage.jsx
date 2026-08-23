import React, { useState } from "react";
import { Leaf, Loader2 } from "lucide-react";
import { useAuth } from "../../../app/providers/AuthProvider";
import { useGoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";
import "./LoginPage.css";

const LoginContent = ({ onSuccess }) => {
  const { loginWithGoogle, loginWithEmail, requestOtp, verifyOtp, register, forgotPassword, resetPassword } = useAuth();

  // view: "login", "register", "forgot"
  const [view, setView] = useState("login");

  // loginMode: "email", "phone"
  const [loginMode, setLoginMode] = useState("email");

  // Common states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");

  // OTP / Reset states
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");

  const clearMessages = () => {
    setError(null);
    setSuccessMsg(null);
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsLoading(true);
      clearMessages();
      try {
        const tokens = await loginWithGoogle(tokenResponse);
        onSuccess?.(tokens);
      } catch (err) {
        setError(err.message || "Google login failed.");
        setIsLoading(false);
      }
    },
    onError: (errorResponse) => {
      console.error("Google OAuth error:", errorResponse);
      setError("Google login was unsuccessful.");
    }
  });

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    clearMessages();
    setIsLoading(true);

    try {
      if (loginMode === "email") {
        await loginWithEmail(email, password);
        onSuccess?.();
      } else {
        if (!otpSent) {
          await requestOtp(phone);
          setOtpSent(true);
          setSuccessMsg("OTP sent to your phone.");
          setIsLoading(false);
        } else {
          await verifyOtp(phone, otpCode);
          onSuccess?.();
        }
      }
    } catch (err) {
      setError(err.message || "Login failed");
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    clearMessages();
    setIsLoading(true);
    try {
      await register(name, email, password, phone);
      onSuccess?.();
    } catch (err) {
      setError(err.message || "Registration failed");
      setIsLoading(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    clearMessages();
    setIsLoading(true);
    try {
      if (!otpSent) {
        await forgotPassword(email);
        setOtpSent(true);
        setSuccessMsg("If an account exists, a reset code was sent to your email.");
      } else {
        await resetPassword(email, otpCode, password);
        setSuccessMsg("Password reset successfully. Please login.");
        setOtpSent(false);
        setOtpCode("");
        setPassword("");
        setView("login");
      }
    } catch (err) {
      setError(err.message || "Action failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-icon-container">
            <Leaf size={44} fill="currentColor" strokeWidth={1} />
          </div>
          <h1 className="login-title">AgriMesh</h1>
          <p className="login-subtitle">Smart Intelligence for Your Fields</p>
        </div>

        {error && <p className="error-text">{error}</p>}
        {successMsg && <p className="success-text">{successMsg}</p>}

        {view === "login" && (
          <>
            <div className="login-tabs">
              <button
                className={`login-tab ${loginMode === "email" ? "active" : ""}`}
                onClick={() => { setLoginMode("email"); clearMessages(); setOtpSent(false); }}
              >
                Email
              </button>
              <button
                className={`login-tab ${loginMode === "phone" ? "active" : ""}`}
                onClick={() => { setLoginMode("phone"); clearMessages(); setOtpSent(false); }}
              >
                Phone OTP
              </button>
            </div>

            <form className="login-form" onSubmit={handleLoginSubmit}>
              {loginMode === "email" ? (
                <>
                  <div className="form-group">
                    <label>Email Address</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label>Password</label>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
                  </div>
                  <button type="button" className="forgot-password-link" onClick={() => { setView("forgot"); clearMessages(); setOtpSent(false); }}>
                    Forgot Password?
                  </button>
                </>
              ) : (
                <>
                  <div className="form-group">
                    <label>Phone Number</label>
                    <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} disabled={otpSent} placeholder="+91 9876543210" required />
                  </div>
                  {otpSent && (
                    <div className="form-group">
                      <label>6-Digit OTP</label>
                      <input type="text" value={otpCode} onChange={e => setOtpCode(e.target.value)} maxLength={6} required />
                    </div>
                  )}
                </>
              )}

              <button type="submit" disabled={isLoading} className="submit-btn">
                {isLoading ? <Loader2 size={16} className="tts-loading-icon" /> : (otpSent ? "Verify & Login" : "Login")}
              </button>
            </form>

            <div className="divider"><span>OR</span></div>

            <button onClick={() => googleLogin()} disabled={isLoading} className="google-btn">
              <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
                <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
                <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
                <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
              </svg>
              Continue with Google
            </button>

            <button className="back-link" onClick={() => { setView("register"); clearMessages(); }}>
              Don't have an account? Sign up
            </button>
          </>
        )}

        {view === "register" && (
          <form className="login-form" onSubmit={handleRegisterSubmit}>
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Phone Number (Optional)</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 9876543210" />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={4} />
            </div>
            <button type="submit" disabled={isLoading} className="submit-btn">
              {isLoading ? <Loader2 size={16} className="tts-loading-icon" /> : "Create Account"}
            </button>
            <button type="button" className="back-link" onClick={() => { setView("login"); clearMessages(); }}>
              Already have an account? Login
            </button>
          </form>
        )}

        {view === "forgot" && (
          <form className="login-form" onSubmit={handleForgotSubmit}>
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} disabled={otpSent} required />
            </div>

            {otpSent && (
              <>
                <div className="form-group">
                  <label>6-Digit Reset Code</label>
                  <input type="text" value={otpCode} onChange={e => setOtpCode(e.target.value)} maxLength={6} required />
                </div>
                <div className="form-group">
                  <label>New Password</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={4} />
                </div>
              </>
            )}

            <button type="submit" disabled={isLoading} className="submit-btn">
              {isLoading ? <Loader2 size={16} className="tts-loading-icon" /> : (otpSent ? "Reset Password" : "Send Reset Code")}
            </button>
            <button type="button" className="back-link" onClick={() => { setView("login"); clearMessages(); }}>
              Back to Login
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export const LoginPage = ({ onSuccess }) => {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID || "missing-client-id"}>
      <LoginContent onSuccess={onSuccess} />
    </GoogleOAuthProvider>
  );
};
