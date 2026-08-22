import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Check } from "lucide-react";
import { voiceApi } from "../api/voiceApi";
import GlobeIcon from "../../../components/hover-ui/globe-icon";
import DownChevron from "../../../components/hover-ui/down-chevron";

const LANGUAGES = [
  { code: "en-US", name: "English" },
  { code: "hi-IN", name: "हिन्दी" },
  { code: "gu-IN", name: "ગુજરાતી" },
];

export const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const [selectedLang, setSelectedLang] = useState(i18n.language || "en-US");
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("agri_lang");
    if (saved) {
      setSelectedLang(saved);
      i18n.changeLanguage(saved);
    }
  }, [i18n]);

  const handleSelect = async (code) => {
    setSelectedLang(code);
    localStorage.setItem("agri_lang", code);
    i18n.changeLanguage(code);
    await voiceApi.setLanguage(code);
  };

  const currentLangName =
    LANGUAGES.find((l) => l.code === selectedLang)?.name || "English";

  return (
    <div 
      className="lang-switcher-container"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="dashboard-header-profile-trigger">
        <GlobeIcon size={16} style={{ color: "#6B7280" }} isHovered={isHovered} />
        <span className="font-semibold text-[13px]" style={{ color: "#374151" }}>{currentLangName}</span>
        <DownChevron size={14} style={{ color: "#9CA3AF" }} isHovered={isHovered} />
      </div>

      <div className="lang-dropdown">
        {LANGUAGES.map((lang) => {
          const isSelected = selectedLang === lang.code;
          return (
            <button
              key={lang.code}
              onClick={() => handleSelect(lang.code)}
              className={`lang-dropdown-option ${isSelected ? "selected" : ""}`}
            >
              <span>{lang.name}</span>
              {isSelected && (
                <Check size={14} style={{ color: "#16A34A", strokeWidth: "2.5" }} />
              )}
            </button>
          );
        })}
      </div>

      {/* Scoped CSS matching the user profile dropdown style */}
      <style>{`
        .lang-switcher-container {
          position: relative;
        }

        .lang-dropdown {
          position: absolute;
          right: 0;
          top: calc(100% + 8px);
          width: 140px;
          background-color: #ffffff;
          border: 1px solid #E5E7EB;
          border-radius: 12px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
          display: flex;
          flex-direction: column;
          padding: 6px 0;
          opacity: 0;
          visibility: hidden;
          transform: translateY(-8px);
          transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
          z-index: 100;
        }

        .lang-switcher-container:hover .lang-dropdown {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
        }

        .lang-dropdown-option {
          width: calc(100% - 16px);
          margin: 2px 8px;
          padding: 8px 12px;
          font-size: 13px;
          font-weight: 500;
          color: #4B5563;
          background: none;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          text-align: left;
          transition: all 0.15s ease;
          font-family: 'Inter', sans-serif;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .lang-dropdown-option:hover {
          background-color: #F3F4F6;
          color: #111827;
        }

        .lang-dropdown-option.selected {
          color: #16A34A;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
};
