import React, { useState, useRef, useEffect } from "react";
import {
  Sprout,
  Phone,
  ArrowRight,
  RotateCcw,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { useAuth } from "../../../app/providers/AuthProvider";

export const LoginPage = ({ onSuccess }) => {
  const { requestOtp, verifyOtp } = useAuth();
  const [step, setStep] = useState("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpRefs = useRef([]);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Auto-focus first OTP box when step changes
  useEffect(() => {
    if (step === "otp") {
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    }
  }, [step]);

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    if (!phone.trim()) return;
    setError(null);
    setIsLoading(true);
    try {
      await requestOtp(phone.trim());
      setStep("otp");
      setResendCooldown(60);
    } catch (err) {
      setError(err.message ?? "Failed to send OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    // Accept single digit only
    const digit = value.replace(/\D/g, "").slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    setError(null);

    // Auto-advance to next box
    if (digit && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits are filled
    if (digit && index === 5) {
      const fullCode = [...newOtp.slice(0, 5), digit].join("");
      if (fullCode.length === 6) handleOtpVerify(fullCode);
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    const newOtp = [...otp];
    pasted.split("").forEach((d, i) => {
      newOtp[i] = d;
    });
    setOtp(newOtp);
    if (pasted.length === 6) handleOtpVerify(pasted);
  };

  const handleOtpVerify = async (code) => {
    const finalCode = code ?? otp.join("");
    if (finalCode.length < 6) return;
    setError(null);
    setIsLoading(true);
    try {
      await verifyOtp(phone, finalCode);
      setStep("success");
      setTimeout(() => onSuccess?.(), 800);
    } catch (err) {
      setError(err.message ?? "Invalid code. Please try again.");
      setOtp(["", "", "", "", "", ""]);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setError(null);
    setOtp(["", "", "", "", "", ""]);
    setIsLoading(true);
    try {
      await requestOtp(phone);
      setResendCooldown(60);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-12">
        <div className="w-10 h-10 bg-primary flex items-center justify-center">
          <Sprout size={22} className="text-primary-content" />
        </div>
        <span className="text-2xl font-black tracking-tight text-text">
          AgriMesh
        </span>
      </div>

      <div className="w-full max-w-sm">
        {/* ─── Phone Step ─────────────────────────────────────── */}
        {step === "phone" && (
          <div className="animate-fade-in-up">
            <h1 className="text-3xl font-black text-text mb-2">Welcome back</h1>
            <p className="text-text-muted mb-8">
              Enter your phone number to continue.
            </p>
            <form onSubmit={handlePhoneSubmit} className="flex flex-col gap-4">
              <div className="relative">
                <Phone
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
                />

                <input
                  id="phone-input"
                  type="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    setError(null);
                  }}
                  placeholder="+91 98765 43210"
                  className="w-full pl-11 pr-4 py-3.5 border-2 border-border bg-background text-text placeholder:text-text-muted font-medium focus:outline-none focus:border-primary transition-colors rounded-none text-base"
                  disabled={isLoading}
                  required
                />
              </div>

              {error && (
                <p className="text-sm text-danger font-medium animate-fade-in-up">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={isLoading || !phone.trim()}
                className="flex items-center justify-center gap-2 w-full py-3.5 bg-primary text-primary-content font-bold text-base hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    Send OTP <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* ─── OTP Step ───────────────────────────────────────── */}
        {step === "otp" && (
          <div className="animate-fade-in-up">
            <button
              onClick={() => {
                setStep("phone");
                setError(null);
              }}
              className="text-sm text-text-muted hover:text-text mb-6 flex items-center gap-1 transition-colors"
            >
              ← Back
            </button>
            <h1 className="text-3xl font-black text-text mb-2">
              Enter your code
            </h1>
            <p className="text-text-muted mb-8">
              We sent a 6-digit code to{" "}
              <strong className="text-text">{phone}</strong>
            </p>

            {/* OTP Input Grid */}
            <div className="flex gap-2 mb-6" onPaste={handleOtpPaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  id={`otp-${i}`}
                  ref={(el) => {
                    otpRefs.current[i] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  disabled={isLoading}
                  className={`
                    flex-1 aspect-square text-center text-2xl font-black border-2 bg-background text-text
                    focus:outline-none transition-all
                    ${digit ? "border-primary" : "border-border"}
                    ${error ? "border-danger" : ""}
                    disabled:opacity-50
                  `}
                />
              ))}
            </div>

            {error && (
              <p className="text-sm text-danger font-medium mb-4 animate-fade-in-up">
                {error}
              </p>
            )}

            <button
              onClick={() => handleOtpVerify()}
              disabled={isLoading || otp.join("").length < 6}
              className="flex items-center justify-center gap-2 w-full py-3.5 bg-primary text-primary-content font-bold text-base hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-4"
            >
              {isLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                "Verify & Continue"
              )}
            </button>

            <button
              onClick={handleResend}
              disabled={resendCooldown > 0 || isLoading}
              className="flex items-center gap-2 text-sm text-text-muted hover:text-text transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <RotateCcw size={14} />
              {resendCooldown > 0
                ? `Resend in ${resendCooldown}s`
                : "Resend code"}
            </button>
          </div>
        )}

        {/* ─── Success Step ───────────────────────────────────── */}
        {step === "success" && (
          <div className="flex flex-col items-center gap-4 animate-fade-in-up">
            <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center">
              <CheckCircle size={36} className="text-success" />
            </div>
            <h2 className="text-2xl font-black text-text">You're in!</h2>
            <p className="text-text-muted text-center">
              Taking you to your field dashboard…
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
