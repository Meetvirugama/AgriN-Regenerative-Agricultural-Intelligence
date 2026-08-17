import React, { useState } from "react";
import { Leaf, Eye, EyeOff, Loader2, Mail, Lock, Smartphone } from "lucide-react";
import { useAuth } from "../../../app/providers/AuthProvider";
import "./LoginPage.css"; // Ensure styles bypass tailwind

export const LoginPage = ({ onSuccess }) => {
  const { verifyOtp, loginWithPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setIsLoading(true);
    setError(null);
    try {
      await loginWithPassword(email, password);
      onSuccess?.();
    } catch (err) {
      setError(err.message || "Invalid credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpLogin = () => {
    alert("Switching to OTP Flow...");
  };

  return (
    <div className="login-container">
      
      {/* Centered White Card */}
      <div className="login-card">
        
        {/* Header */}
        <div className="login-header">
          <div className="login-icon-container">
            <Leaf size={44} fill="currentColor" strokeWidth={1} />
          </div>
          <h1 className="login-title">
            AgriMesh
          </h1>
          <p className="login-subtitle">Smart Intelligence for Your Fields</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="login-form">
          
          {/* Email / Phone */}
          <div className="input-group">
            <label className="input-label">Email / Phone</label>
            <div className="input-wrapper">
              <Mail size={18} className="input-icon" />
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email or phone"
                className="login-input"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="input-group">
            <label className="input-label">Password</label>
            <div className="input-wrapper">
              <Lock size={18} className="input-icon" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="login-input"
                style={{ paddingRight: '2.75rem' }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="password-toggle"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && <p className="error-text">{error}</p>}

          <div className="forgot-password-container">
            <a href="#" className="forgot-password-link">
              Forgot password?
            </a>
          </div>

          <button
            type="submit"
            disabled={isLoading || !email || !password}
            className="submit-btn"
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : "Login"}
          </button>
        </form>

        {/* OR Divider */}
        <div className="divider-container">
          <div className="divider-line-wrapper">
            <div className="divider-line"></div>
          </div>
          <div className="divider-text-wrapper">
            <span className="divider-text">OR</span>
          </div>
        </div>

        {/* Login with OTP Button */}
        <button
          onClick={handleOtpLogin}
          type="button"
          className="otp-btn"
        >
          <Smartphone size={18} />
          Login with OTP
        </button>

        <div className="signup-container">
          Don't have an account?{" "}
          <a href="#" className="signup-link">
            Sign up
          </a>
        </div>
      </div>

    </div>
  );
};
