import React, { useState } from "react";
import { Leaf, Eye, EyeOff, Loader2, Mail, Lock, Smartphone } from "lucide-react";
import { useAuth } from "../../../app/providers/AuthProvider";

export const LoginPage = ({ onSuccess }) => {
  const { verifyOtp } = useAuth(); // Using this as mock auth for now
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
      // Mocking the OTP verify call since the backend expects OTP right now
      await verifyOtp("mock", "123456"); 
      onSuccess?.();
    } catch (err) {
      setError("Invalid credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpLogin = () => {
    alert("Switching to OTP Flow...");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      
      {/* Centered White Card */}
      <div className="bg-surface border border-border shadow-sm rounded-2xl w-full max-w-[420px] p-8 animate-fade-in-up">
        
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 flex items-center justify-center mb-3 text-primary">
            <Leaf size={40} fill="currentColor" strokeWidth={1} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-text-main mb-1">
            AgriMesh
          </h1>
          <p className="text-sm text-text-muted">Smart Intelligence for Your Fields</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          
          {/* Email / Phone */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text-main">Email / Phone</label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email or phone"
                className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text-main">Password</label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full pl-10 pr-11 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && <p className="text-sm text-danger font-medium">{error}</p>}

          <div className="flex justify-end">
            <a href="#" className="text-sm font-medium text-text-main hover:underline">
              Forgot password?
            </a>
          </div>

          <button
            type="submit"
            disabled={isLoading || !email || !password}
            className="w-full py-2.5 bg-text-main text-surface font-semibold rounded-lg text-sm hover:bg-text-main/90 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : "Login"}
          </button>
        </form>

        {/* OR Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-surface px-2 text-text-muted font-medium">OR</span>
          </div>
        </div>

        {/* Login with OTP Button */}
        <button
          onClick={handleOtpLogin}
          type="button"
          className="w-full py-2.5 bg-surface border border-border text-text-main font-semibold rounded-lg text-sm hover:bg-secondary active:scale-[0.99] transition-all flex items-center justify-center gap-2"
        >
          <Smartphone size={18} />
          Login with OTP
        </button>

        <div className="mt-8 text-center text-sm text-text-muted">
          Don't have an account?{" "}
          <a href="#" className="font-medium text-primary hover:underline">
            Sign up
          </a>
        </div>
      </div>

    </div>
  );
};
