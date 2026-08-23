import { useState, useRef, useEffect } from "react";
import "./Combobox.css";

/**
 * Combobox Component
 * A custom select input that allows typing to filter.
 * Supports strings OR objects { value, label } for i18n support.
 */
export function Combobox({ label, value, onChange, options, placeholder, disabled, emptyText = "No options available" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const containerRef = useRef(null);

  const getLabel = (opt) => (typeof opt === "string" ? opt : opt.label);
  const getValue = (opt) => (typeof opt === "string" ? opt : opt.value);

  // Sync internal input value with external value prop
  useEffect(() => {
    if (!value) {
      setInputValue("");
      return;
    }
    const matchingOpt = options.find((opt) => getValue(opt) === value);
    if (matchingOpt) {
      setInputValue(getLabel(matchingOpt));
    } else {
      setInputValue(value);
    }
  }, [value, options]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        const matchingOpt = options.find((opt) => getValue(opt) === value);
        setInputValue(matchingOpt ? getLabel(matchingOpt) : (value || ""));
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [value, options]);

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    setIsOpen(true);
    if (e.target.value === "") {
      onChange("");
    }
  };

  const handleOptionClick = (opt) => {
    setInputValue(getLabel(opt));
    onChange(getValue(opt));
    setIsOpen(false);
  };

  const sortedOptions = [...options].sort((a, b) => {
    if (!inputValue) return 0;
    
    const search = inputValue.toLowerCase();
    const aLower = getLabel(a).toLowerCase();
    const bLower = getLabel(b).toLowerCase();
    
    const aStarts = aLower.startsWith(search);
    const bStarts = bLower.startsWith(search);
    const aIncludes = aLower.includes(search);
    const bIncludes = bLower.includes(search);

    if (aStarts && !bStarts) return -1;
    if (!aStarts && bStarts) return 1;
    if (aIncludes && !bIncludes) return -1;
    if (!aIncludes && bIncludes) return 1;

    return getLabel(a).localeCompare(getLabel(b));
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
                const lbl = getLabel(opt);
                const val = getValue(opt);
                const isMatch = lbl.toLowerCase().includes(search) && search !== "";
                return (
                  <li
                    key={i}
                    onClick={() => handleOptionClick(opt)}
                    className={`combobox-option ${isMatch ? "highlight" : ""} ${value === val ? "selected" : ""}`}
                  >
                    {lbl}
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
