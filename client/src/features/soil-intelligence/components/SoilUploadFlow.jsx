import React, { useRef, useState } from "react";
import { uploadSoilLabReport } from "../api/soilApi";
import { UploadCloud, X } from "lucide-react";

const ACCEPTED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export function SoilUploadFlow({ fieldId, onClose, onSuccess }) {
  const inputRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  function validateFile(file) {
    if (!file) return "Please select a file.";
    if (!ACCEPTED_TYPES.includes(file.type)) return "Only PDF, JPG, PNG, or WEBP files are supported.";
    if (file.size > MAX_FILE_SIZE) return "The file must be smaller than 10 MB.";
    return "";
  }

  function selectFile(file) {
    const validationError = validateFile(file);
    setError(validationError);
    if (validationError) {
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
  }

  function handleInputChange(event) {
    selectFile(event.target.files?.[0] || null);
  }

  function handleDrop(event) {
    event.preventDefault();
    setDragActive(false);
    selectFile(event.dataTransfer.files?.[0] || null);
  }

  async function handleUpload() {
    if (!selectedFile) {
      setError("Please select a lab report first.");
      return;
    }
    setError("");
    setUploading(true);

    try {
      const updatedSoil = await uploadSoilLabReport(fieldId, selectedFile);
      onSuccess?.(updatedSoil);
    } catch (uploadError) {
      setError(
        uploadError?.message ||
          "The lab report could not be uploaded. Please try again."
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !uploading) {
          onClose();
        }
      }}
    >
      <div
        className="w-full max-w-lg max-h-[calc(100vh-2rem)] overflow-y-auto bg-surface p-6 sm:p-8 rounded-[2rem] shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="soil-upload-title"
      >
        <div className="flex justify-between items-start gap-4 mb-6">
          <div>
            <div className="text-[10px] font-black tracking-[0.2em] uppercase text-text-muted/60 mb-2">SOIL HEALTH</div>
            <h2 id="soil-upload-title" className="text-2xl font-black tracking-tight text-text">
              Upload Lab Report
            </h2>
            <p className="text-sm font-medium text-text-muted mt-2 leading-relaxed">
              We will extract the available soil measurements and update this
              field's profile after successful processing.
            </p>
          </div>
          <button
            type="button"
            className="w-10 h-10 flex items-center justify-center rounded-full bg-neutral/10 hover:bg-neutral/20 text-text transition-colors shrink-0"
            onClick={onClose}
            disabled={uploading}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div
          className={`
            flex flex-col items-center justify-center min-h-[240px] mt-2 p-6 border-2 border-dashed rounded-3xl text-center cursor-pointer transition-all duration-300
            ${dragActive ? "border-primary bg-primary/5" : "border-border hover:border-neutral/50 hover:bg-neutral/5"}
            ${selectedFile ? "bg-success/5 border-success/30" : ""}
          `}
          onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") inputRef.current?.click();
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            onChange={handleInputChange}
            hidden
          />

          <div className="w-14 h-14 flex items-center justify-center rounded-2xl bg-neutral/10 text-text mb-4">
            <UploadCloud size={24} strokeWidth={2.5} />
          </div>

          {selectedFile ? (
            <>
              <strong className="text-sm font-bold text-text">{selectedFile.name}</strong>
              <span className="text-xs font-medium text-text-muted mt-1.5">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </span>
            </>
          ) : (
            <>
              <strong className="text-sm font-bold text-text">Drop your lab report here</strong>
              <span className="text-xs font-medium text-text-muted mt-1.5">or click to browse</span>
            </>
          )}

          <small className="text-[10px] font-bold tracking-wider uppercase text-text-muted/60 mt-6">PDF, JPG, PNG, WEBP · Max 10 MB</small>
        </div>

        {error && (
          <div className="mt-4 p-3.5 bg-error/10 text-error-strong text-xs font-bold rounded-xl" role="alert">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3 mt-8">
          <button
            type="button"
            className="px-5 py-2.5 rounded-xl text-sm font-bold bg-neutral/10 hover:bg-neutral/20 text-text transition-colors focus-visible:outline-2 focus-visible:outline-primary"
            onClick={onClose}
            disabled={uploading}
          >
            Cancel
          </button>
          <button
            type="button"
            className="px-6 py-2.5 rounded-xl text-sm font-bold bg-primary text-surface hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-primary"
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
          >
            {uploading ? "Processing…" : "Upload & Replace"}
          </button>
        </div>
      </div>
    </div>
  );
}
