import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, ChevronRight, Leaf, MapPin, Calendar } from "lucide-react";
import { useAuth } from "../features/auth/AuthProvider";

export const Onboarding = () => {
  const { farmer } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [fieldName, setFieldName] = useState("");
  const [cropType, setCropType] = useState("wheat");
  const [sowingDate, setSowingDate] = useState("");

  const handleComplete = async () => {
    if (!fieldName || !sowingDate) return;
    setIsSubmitting(true);
    try {
      // Create Field API Call
      const res = await fetch("http://localhost:8000/api/v1/fields/stub-init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Failed to create field");
      const data = await res.json();
      // Navigate to the new field dashboard
      navigate(`/field/${data.field.id}`);
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-color)] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-[var(--card-bg)] rounded-2xl shadow-xl border border-[var(--border-color)] overflow-hidden">
        {/* Header */}
        <div className="bg-[var(--primary)] p-6 text-[var(--bg-color)] text-center">
          <h1 className="text-2xl font-bold mb-1">Welcome to AgriMesh</h1>
          <p className="text-sm opacity-90">
            Let's set up your first field profile.
          </p>
        </div>

        {/* Form Body */}
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <div
              className={`h-2 flex-1 rounded-full ${step >= 1 ? "bg-[var(--primary)]" : "bg-[var(--border-color)]"}`}
            />
            <div
              className={`h-2 flex-1 rounded-full ${step >= 2 ? "bg-[var(--primary)]" : "bg-[var(--border-color)]"}`}
            />
          </div>

          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                <MapPin className="text-[var(--primary)]" /> Field Details
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                    Field Name
                  </label>
                  <input
                    type="text"
                    value={fieldName}
                    onChange={(e) => setFieldName(e.target.value)}
                    placeholder="e.g. North Plot"
                    className="w-full bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  />
                </div>
                <button
                  onClick={() => setStep(2)}
                  disabled={!fieldName.trim()}
                  className="w-full bg-[var(--primary)] text-[var(--bg-color)] rounded-xl px-4 py-3 font-bold mt-4 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--primary-hover)] transition-colors"
                >
                  Continue <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                <Leaf className="text-[var(--primary)]" /> Crop Context
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                    Primary Crop
                  </label>
                  <select
                    value={cropType}
                    onChange={(e) => setCropType(e.target.value)}
                    className="w-full bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  >
                    <option value="wheat">Wheat</option>
                    <option value="rice">Rice</option>
                    <option value="corn">Corn</option>
                    <option value="cotton">Cotton</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1 flex items-center gap-1">
                    <Calendar size={14} /> Sowing Date
                  </label>
                  <input
                    type="date"
                    value={sowingDate}
                    onChange={(e) => setSowingDate(e.target.value)}
                    className="w-full bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 bg-[var(--bg-color)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-xl px-4 py-3 font-bold hover:bg-[var(--card-bg)] transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleComplete}
                    disabled={!sowingDate || isSubmitting}
                    className="flex-[2] bg-[var(--primary)] text-[var(--bg-color)] rounded-xl px-4 py-3 font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--primary-hover)] transition-colors"
                  >
                    {isSubmitting ? (
                      <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <>
                        Complete Setup <Check size={18} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
