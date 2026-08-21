import React, { useEffect, useState } from "react";
import { Sprout, ArrowRight, Leaf } from "lucide-react";
import { regenApi } from "../api/regenApi";
import { CropPlanningModal } from "./CropPlanningModal";
import "./RegenPlanningCard.css";

export function RegenPlanningCard({ fieldId }) {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function fetchPlan() {
      try {
        const data = await regenApi.getRegenPlan(fieldId);
        if (mounted) setPlan(data);
      } catch (err) {
        console.error(err);
        if (mounted) setError("Could not load planning insights");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchPlan();
    return () => {
      mounted = false;
    };
  }, [fieldId]);

  if (loading) {
    return (
      <div className="regen-planning-skeleton">
        <div className="regen-planning-skeleton-title"></div>
        <div className="regen-planning-skeleton-body"></div>
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="regen-planning-error">
        <div className="regen-planning-error-header">
          <div className="regen-planning-error-icon-wrapper">
            <Leaf size={20} />
          </div>
          <h3 className="regen-planning-error-title">
            Regen Planning
          </h3>
        </div>
        <p className="regen-planning-error-message">
          {error || "Could not load planning insights"}
        </p>
      </div>
    );
  }

  const topPractice = plan.practices[0];

  return (
    <div className="regen-planning-container">
      <div className="regen-planning-bg-icon">
        <Leaf size={120} />
      </div>

      <div className="regen-planning-content">
        <h3 className="regen-planning-header">
          <Sprout size={16} /> Soil Health & Future Planning
        </h3>

        {topPractice && (
          <div className="regen-practice-section">
            <h4 className="regen-practice-title">{topPractice.title}</h4>
            <p className="regen-practice-reasoning">
              {topPractice.reasoning}
            </p>
            <div className="regen-practice-effort">
              Effort: {topPractice.effort_level}
            </div>
          </div>
        )}

        <button
          onClick={() => setShowModal(true)}
          className="regen-explore-btn"
        >
          Explore Next Season Options <ArrowRight size={16} />
        </button>
      </div>

      {showModal && (
        <CropPlanningModal
          options={plan.next_season_options}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
