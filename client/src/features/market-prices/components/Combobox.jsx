import { useState, useRef, useEffect } from "react";
import "./Combobox.css";

/**
 * Combobox Component
 * A custom select input that allows typing to filter.
 * Crucially, it sorts matching items to the top, but keeps non-matching items below them.
 */
export function Combobox({ label, value, onChange, options, placeholder, disabled, emptyText = "No options available" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value || "");
  const containerRef = useRef(null);

  // Sync internal input value with external value prop
  useEffect(() => {
    setInputValue(value || "");
  }, [value]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        // Reset input to actual value if user typed but didn't select
        setInputValue(value || "");
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [value]);

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    setIsOpen(true);
    // If they clear the input, clear the actual value too
    if (e.target.value === "") {
      onChange("");
    }
  };

  const handleOptionClick = (option) => {
    setInputValue(option);
    onChange(option);
    setIsOpen(false);
  };

  // Sort options: exact matches first, partial matches second, non-matches last
  const sortedOptions = [...options].sort((a, b) => {
    if (!inputValue) return 0;
    
    const search = inputValue.toLowerCase();
    const aLower = a.toLowerCase();
    const bLower = b.toLowerCase();
    
    const aStarts = aLower.startsWith(search);
    const bStarts = bLower.startsWith(search);
    const aIncludes = aLower.includes(search);
    const bIncludes = bLower.includes(search);

    // Both start with the search term
    if (aStarts && !bStarts) return -1;
    if (!aStarts && bStarts) return 1;

    // Both include the search term
    if (aIncludes && !bIncludes) return -1;
    if (!aIncludes && bIncludes) return 1;

    return a.localeCompare(b);
  });

  return (
    <div className="market-form-group" ref={containerRef}>
      {label && <label>{label}</label>}
      <div className="combobox-wrapper">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          className="combobox-input"
        />
        {isOpen && !disabled && (
          <ul className="combobox-list">
            {sortedOptions.length > 0 ? (
              sortedOptions.map((opt, i) => {
                const search = inputValue.toLowerCase();
                const isMatch = opt.toLowerCase().includes(search) && search !== "";
                return (
                  <li
                    key={i}
                    onClick={() => handleOptionClick(opt)}
                    className={`combobox-option ${isMatch ? "highlight" : ""} ${value === opt ? "selected" : ""}`}
                  >
                    {opt}
                  </li>
                );
              })
            ) : (
              <li className="combobox-empty">{emptyText}</li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
}
