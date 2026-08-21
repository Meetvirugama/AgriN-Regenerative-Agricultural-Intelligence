import React, { useRef, useState } from "react";
import { uploadSoilLabReport } from "../api/soilApi";
import { UploadCloud, X } from "lucide-react";
import "./SoilUploadFlow.css";

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
      className="soil-upload-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !uploading) {
          onClose();
        }
      }}
    >
      <div
        className="soil-upload-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="soil-upload-title"
      >
        <div className="soil-upload-header">
          <div>
            <div className="soil-upload-eyebrow">SOIL HEALTH</div>
            <h2 id="soil-upload-title" className="soil-upload-title">
              Upload Lab Report
            </h2>
            <p className="soil-upload-desc">
              We will extract the available soil measurements and update this
              field's profile after successful processing.
            </p>
          </div>
          <button
            type="button"
            className="soil-upload-close-btn"
            onClick={onClose}
            disabled={uploading}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div
          className={`
            soil-upload-dropzone
            ${dragActive ? "soil-upload-dropzone-active" : ""}
            ${selectedFile ? "soil-upload-dropzone-selected" : ""}
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

          <div className="soil-upload-icon-wrapper">
            <UploadCloud size={24} strokeWidth={2.5} />
          </div>

          {selectedFile ? (
            <>
              <strong className="soil-upload-filename">{selectedFile.name}</strong>
              <span className="soil-upload-filesize">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </span>
            </>
          ) : (
            <>
              <strong className="soil-upload-filename">Drop your lab report here</strong>
              <span className="soil-upload-filesize">or click to browse</span>
            </>
          )}

          <small className="soil-upload-hint">PDF, JPG, PNG, WEBP · Max 10 MB</small>
        </div>

        {error && (
          <div className="soil-upload-error" role="alert">
            {error}
          </div>
        )}

        <div className="soil-upload-actions">
          <button
            type="button"
            className="soil-upload-cancel-btn"
            onClick={onClose}
            disabled={uploading}
          >
            Cancel
          </button>
          <button
            type="button"
            className="soil-upload-submit-btn"
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
