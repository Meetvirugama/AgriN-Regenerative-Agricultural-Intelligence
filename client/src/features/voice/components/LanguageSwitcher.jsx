import React, { useState, useEffect } from "react";
import { voiceApi } from "../api/voiceApi";

const LANGUAGES = [
  { code: "en-US", name: "English" },
  { code: "hi-IN", name: "हिन्दी" },
  { code: "mr-IN", name: "मराठी" },
  { code: "te-IN", name: "తెలుగు (Text Only)" }, // Mocking graceful degradation for Text-only fallback
];

export const LanguageSwitcher = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState("en-US");

  useEffect(() => {
    const saved = localStorage.getItem("agri_lang");
    if (saved) {
      setSelectedLang(saved);
    }
  }, []);

  const handleSelect = async (code) => {
    setSelectedLang(code);
    localStorage.setItem("agri_lang", code);
    setIsOpen(false);
    // Update backend (Layer 01)
    await voiceApi.setLanguage(code);

    // In a real app we might reload or trigger context update so upstream layers fetch translated text
  };

  const currentLangName =
    LANGUAGES.find((l) => l.code === selectedLang)?.name || "English";

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-neutral/10 hover:bg-neutral/20 border border-neutral/30 px-3 py-1.5 rounded-full transition-colors"
      >
        <svg
          className="w-5 h-5 text-text-muted"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
          />
        </svg>
        <span className="font-bold text-sm tracking-wide">
          {currentLangName.split(" ")[0]}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-surface border-2 border-black rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="p-3 bg-neutral/10 border-b border-black">
            <h4 className="text-xs font-black uppercase tracking-widest text-text-muted">
              Select Language
            </h4>
          </div>
          <div className="flex flex-col">
            {LANGUAGES.map((lang) => {
              const isTextOnly = lang.name.includes("Text Only");
              return (
                <button
                  key={lang.code}
                  onClick={() => handleSelect(lang.code)}
                  className={`flex flex-col text-left p-4 border-b border-neutral/20 last:border-b-0 hover:bg-neutral/10 transition-colors ${selectedLang === lang.code ? "bg-primary/5 text-primary" : ""}`}
                >
                  <span className="font-bold text-lg">
                    {lang.name.replace(" (Text Only)", "")}
                  </span>
                  {isTextOnly && (
                    <span className="text-xs font-semibold text-warning mt-1">
                      Audio features not yet supported
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
