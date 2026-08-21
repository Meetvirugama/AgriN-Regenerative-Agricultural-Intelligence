import React, { useState } from "react";
import { ThumbsUp, ThumbsDown, X, Camera } from "lucide-react";
import { memoryApi } from "../api/memoryApi";
import { TextToSpeechButton } from "../../voice/components/TextToSpeechButton";

import "./FeedbackPrompt.css";

export const FeedbackPrompt = ({ prompt, onDismiss }) => {
  const [expanded, setExpanded] = useState(false);
  const [note, setNote] = useState("");
  const [selectedResponse, setSelectedResponse] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleResponse = (type) => {
    setSelectedResponse(type);
    setExpanded(true);
  };

  const handleSubmit = async () => {
    if (!selectedResponse) return;
    setIsSubmitting(true);
    await memoryApi.submitFeedback(
      prompt.advisory_id,
      prompt.field_id,
      selectedResponse,
      note,
    );
    setIsSubmitting(false);
    onDismiss();
  };

  const handleSkip = () => {
    onDismiss();
  };

  return (
    <div className="feedback-prompt-container">
      <div className="feedback-header">
        <h3 className="feedback-title">
          Did this advice help?
          <TextToSpeechButton
            textToRead={`Did this advice help? ${prompt.summary}`}
            className="w-7 h-7 p-1" // Keep this minimal tailwind for TextToSpeech button sizing if needed, or we can leave it as is.
          />
        </h3>
        <button
          onClick={handleSkip}
          className="feedback-dismiss-btn"
        >
          <X size={20} />
        </button>
      </div>

      <p className="feedback-summary">
        "{prompt.summary}"
      </p>

      {!expanded ? (
        <div className="feedback-buttons">
          <button
            onClick={() => handleResponse("helped")}
            className="feedback-btn feedback-btn-yes"
          >
            <ThumbsUp size={20} /> Yes, it helped
          </button>
          <button
            onClick={() => handleResponse("didnt_help")}
            className="feedback-btn feedback-btn-no"
          >
            <ThumbsDown size={20} /> Not really
          </button>
        </div>
      ) : (
        <div className="feedback-expanded">
          <label className="feedback-label">
            Add a quick note or photo (Optional)
          </label>
          <div className="feedback-input-row">
            <input
              type="text"
              placeholder="What actually happened?"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="feedback-input"
            />

            <button className="feedback-camera-btn">
              <Camera size={20} />
            </button>
          </div>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="feedback-submit-btn"
          >
            {isSubmitting ? "Saving..." : "Submit Feedback"}
          </button>
        </div>
      )}
    </div>
  );
};
