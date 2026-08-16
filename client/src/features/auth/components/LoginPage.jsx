import React, { useState } from "react";
import { Sprout, Eye, EyeOff, Loader2 } from "lucide-react";
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
      // In a real email/pwd flow, we would call authApi.login(email, password)
      await verifyOtp("mock", "123456"); 
      onSuccess?.();
    } catch (err) {
      setError("Invalid credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      
      {/* Centered White Card */}
      <div className="bg-surface border border-border shadow-sm rounded-2xl w-full max-w-[420px] p-8 animate-fade-in-up">
        
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-2 mb-2">
            <div className="text-primary">
              <Sprout size={28} strokeWidth={2.5} />
            </div>
            <span className="text-2xl font-bold tracking-tight text-text-main">
              AgriMesh
            </span>
          </div>
          <p className="text-sm text-text-muted">Welcome back!</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          
          {/* Email / Phone */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text-main">Email / Phone</label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email or phone"
              className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              required
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text-main">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full pl-4 pr-11 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
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
