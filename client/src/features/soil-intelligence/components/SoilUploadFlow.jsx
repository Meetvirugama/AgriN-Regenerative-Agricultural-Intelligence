import { useState, useRef } from "react";
import { UploadCloud, FileWarning, CheckCircle2 } from "lucide-react";
import { soilApi } from "../api/soilApi";
import { Dialog } from "../../../components/ui/Dialog";

export function SoilUploadFlow({ fieldId, onClose, onSave }) {
  const [step, setStep] = useState("upload");
  const [parsedData, setParsedData] = useState(null);
  const [editedData, setEditedData] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStep("analyzing");
    try {
      const data = await soilApi.parseLabReport(fieldId, file);
      // Handle the "blurry scan" / low confidence UX requirement
      if (data.overall_confidence < 50) {
        setStep("blurry_error");
        return;
      }

      setParsedData(data);
      setEditedData(data);
      setStep("review");
    } catch (err) {
      console.error(err);
      console.error("Failed to parse document. Please try again.");
      setStep("upload");
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const savedProfile = await soilApi.saveSoilProfile(fieldId, editedData);
      onSave(savedProfile);
      onClose();
    } catch (err) {
      console.error(err);
      console.error("Failed to save soil profile");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog
      isOpen={true}
      onClose={onClose}
      title="Add Soil Report"
      className="max-w-md"
    >
      <div className="flex flex-col">
        {step === "upload" && (
          <div className="text-center py-8">
            <UploadCloud size={48} className="mx-auto text-primary mb-4" />
            <h3 className="font-bold text-xl mb-2">Upload Lab Report</h3>
            <p className="text-text-muted mb-6">
              Take a photo or upload a PDF of your latest soil lab report. We'll
              automatically extract the details.
            </p>
            <input
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileSelect}
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full bg-primary text-surface py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            >
              Choose File
            </button>
          </div>
        )}

        {step === "analyzing" && (
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-neutral border-t-primary rounded-full animate-spin mx-auto mb-6"></div>
            <h3 className="font-bold text-xl mb-2 animate-pulse">
              Reading your report...
            </h3>
            <p className="text-text-muted">
              Our AI is extracting texture, OM%, and nutrients.
            </p>
          </div>
        )}

        {step === "blurry_error" && (
          <div className="text-center py-8 animate-fade-in">
            <FileWarning size={48} className="mx-auto text-warning mb-4" />
            <h3 className="font-bold text-xl mb-2 text-warning">
              Low Quality Scan
            </h3>
            <p className="text-text-muted mb-6">
              We couldn't clearly read the values in that document. Please
              ensure the photo is well-lit and in focus.
            </p>
            <button
              onClick={() => setStep("upload")}
              className="w-full bg-primary text-surface py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Try Again
            </button>
          </div>
        )}

        {step === "review" && parsedData && (
          <div className="animate-fade-in">
            <div className="flex items-center gap-2 text-success mb-6 bg-success/10 p-3 rounded-lg">
              <CheckCircle2 size={20} />
              <span className="font-bold text-sm">
                Successfully extracted! Please verify below.
              </span>
            </div>

            <div className="space-y-4 max-h-[50vh] overflow-y-auto px-1">
              <div>
                <label className="flex items-center justify-between text-sm font-bold text-text-muted mb-1">
                  Texture
                  {parsedData.field_confidences?.texture < 80 && (
                    <span className="text-warning text-xs flex items-center gap-1">
                      <FileWarning size={12} /> Verify
                    </span>
                  )}
                </label>
                <select
                  className={`w-full p-3 bg-background border rounded-lg font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${parsedData.field_confidences?.texture < 80 ? "border-warning bg-warning/5" : "border-neutral"}`}
                  value={editedData.texture || ""}
                  onChange={(e) =>
                    setEditedData({ ...editedData, texture: e.target.value })
                  }
                >
                  <option value="sandy">Sandy</option>
                  <option value="loam">Loam</option>
                  <option value="clay">Clay</option>
                  <option value="sandy_loam">Sandy Loam</option>
                  <option value="clay_loam">Clay Loam</option>
                  <option value="silt_loam">Silt Loam</option>
                </select>
              </div>

              <div>
                <label className="flex items-center justify-between text-sm font-bold text-text-muted mb-1">
                  Organic Matter (%)
                  {parsedData.field_confidences?.organic_matter_pct < 80 && (
                    <span className="text-warning text-xs flex items-center gap-1">
                      <FileWarning size={12} /> Verify
                    </span>
                  )}
                </label>
                <input
                  type="number"
                  className={`w-full p-3 bg-background border rounded-lg font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${parsedData.field_confidences?.organic_matter_pct < 80 ? "border-warning bg-warning/5" : "border-neutral"}`}
                  value={editedData.organic_matter_pct || ""}
                  onChange={(e) =>
                    setEditedData({
                      ...editedData,
                      organic_matter_pct: parseFloat(e.target.value),
                    })
                  }
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="flex items-center justify-between text-sm font-bold text-text-muted mb-1">
                    Nitrogen
                    {parsedData.field_confidences?.nitrogen_level < 80 && (
                      <FileWarning size={12} className="text-warning" />
                    )}
                  </label>
                  <select
                    className={`w-full p-3 bg-background border rounded-lg font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${parsedData.field_confidences?.nitrogen_level < 80 ? "border-warning bg-warning/5" : "border-neutral"}`}
                    value={editedData.nitrogen_level || ""}
                    onChange={(e) =>
                      setEditedData({
                        ...editedData,
                        nitrogen_level: e.target.value,
                      })
                    }
                  >
                    <option value="low">Low</option>
                    <option value="medium">Med</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="flex items-center justify-between text-sm font-bold text-text-muted mb-1">
                    Phosphorus
                    {parsedData.field_confidences?.phosphorus_level < 80 && (
                      <FileWarning size={12} className="text-warning" />
                    )}
                  </label>
                  <select
                    className={`w-full p-3 bg-background border rounded-lg font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${parsedData.field_confidences?.phosphorus_level < 80 ? "border-warning bg-warning/5" : "border-neutral"}`}
                    value={editedData.phosphorus_level || ""}
                    onChange={(e) =>
                      setEditedData({
                        ...editedData,
                        phosphorus_level: e.target.value,
                      })
                    }
                  >
                    <option value="low">Low</option>
                    <option value="medium">Med</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="flex items-center justify-between text-sm font-bold text-text-muted mb-1">
                    Potassium
                    {parsedData.field_confidences?.potassium_level < 80 && (
                      <FileWarning size={12} className="text-warning" />
                    )}
                  </label>
                  <select
                    className={`w-full p-3 bg-background border rounded-lg font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${parsedData.field_confidences?.potassium_level < 80 ? "border-warning bg-warning/5" : "border-neutral"}`}
                    value={editedData.potassium_level || ""}
                    onChange={(e) =>
                      setEditedData({
                        ...editedData,
                        potassium_level: e.target.value,
                      })
                    }
                  >
                    <option value="low">Low</option>
                    <option value="medium">Med</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="flex items-center justify-between text-sm font-bold text-text-muted mb-1">
                  pH Level
                  {parsedData.field_confidences?.ph < 80 && (
                    <span className="text-warning text-xs flex items-center gap-1">
                      <FileWarning size={12} /> Verify
                    </span>
                  )}
                </label>
                <input
                  type="number"
                  step="0.1"
                  className={`w-full p-3 bg-background border rounded-lg font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${parsedData.field_confidences?.ph < 80 ? "border-warning bg-warning/5" : "border-neutral"}`}
                  value={editedData.ph || ""}
                  onChange={(e) =>
                    setEditedData({
                      ...editedData,
                      ph: parseFloat(e.target.value),
                    })
                  }
                />
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-neutral flex gap-3">
              <button
                onClick={() => setStep("upload")}
                className="flex-1 bg-neutral/20 text-text font-bold py-3 rounded-xl hover:bg-neutral/30 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
              >
                Retake
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-2 w-2/3 bg-primary text-surface font-bold py-3 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                {isSaving ? "Saving..." : "Save Profile"}
              </button>
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
}
