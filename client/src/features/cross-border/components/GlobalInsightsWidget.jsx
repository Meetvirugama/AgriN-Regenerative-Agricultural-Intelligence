import React, { useEffect, useState } from "react";
import { crossBorderApi } from "../api/crossBorderApi";
import { Globe2, TrendingUp, Lightbulb, MapPin, Activity } from "lucide-react";

export const GlobalInsightsWidget = ({ fieldId }) => {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const data = await crossBorderApi.getInsights(fieldId);
        setInsights(data.insights || []);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch cross-border insights", err);
        setError(err.message || "Failed to load global insights.");
      } finally {
        setLoading(false);
      }
    };
    fetchInsights();
  }, [fieldId]);

  if (loading) {
    return (
      <div className="bg-surface border border-neutral p-6 rounded-2xl shadow-sm animate-pulse">
        <div className="h-6 bg-neutral/20 rounded w-1/2 mb-4"></div>
        <div className="h-24 bg-neutral/20 rounded w-full"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-surface border border-danger p-6 rounded-2xl shadow-sm relative overflow-hidden">
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-danger text-background p-2 rounded-lg">
            <Globe2 size={20} />
          </div>
          <h2 className="font-black text-xl text-text tracking-tight">
            Global Insights
          </h2>
        </div>
        <p className="text-danger font-medium text-sm">{error}</p>
      </div>
    );
  }

  if (insights.length === 0) {
    return null;
  }

  return (
    <div className="bg-primary/5 border border-primary/20 p-6 rounded-2xl shadow-sm relative overflow-hidden">
      {/* Decorative background element */}
      <div className="absolute -right-12 -top-12 text-primary/10">
        <Globe2 size={120} />
      </div>

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-6">
          <div className="bg-primary text-primary-content p-2 rounded-lg">
            <Globe2 size={20} />
          </div>
          <div>
            <h2 className="font-black text-xl text-text tracking-tight">
              Global Insights
            </h2>
            <p className="text-xs font-bold text-primary uppercase tracking-widest">
              Layer 14 Cross-Border Intelligence
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {insights.map((insight) => (
            <div
              key={insight.id}
              className="bg-surface rounded-xl p-4 border border-neutral shadow-sm"
            >
              <div className="flex justify-between items-start mb-3">
                <span className="inline-flex items-center gap-1.5 bg-neutral/30 px-2.5 py-1 rounded-full text-xs font-bold text-text-muted">
                  <MapPin size={12} /> {insight.sourceRegion}
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1">
                  <TrendingUp size={12} /> {insight.adoptionRate}% Adoption
                </span>
              </div>

              <p className="text-sm text-text-muted mb-2 italic">
                "Similar farms in the {insight.comparableClimateZone} climate
                have found that..."
              </p>

              <div className="flex gap-3">
                <div className="mt-1">
                  {insight.insightType === "practice" ? (
                    <Lightbulb size={20} className="text-warning" />
                  ) : (
                    <Activity size={20} className="text-danger" />
                  )}
                </div>
                <p className="font-semibold text-text leading-relaxed">
                  {insight.recommendation}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
