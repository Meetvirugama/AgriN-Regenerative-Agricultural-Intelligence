import { useCallback, useEffect, useRef, useState } from "react";
import { request } from "../../../services/apiClient";

function normalizeSatelliteData(source) {
  if (!source) return null;

  return {
    status: source.status || "healthy",
    healthScore: source.healthScore ?? source.health_score ?? null,
    vegetationTrend: source.vegetationTrend ?? source.vegetation_trend ?? "unavailable",
    moistureTrend: source.moistureTrend ?? source.moisture_trend ?? "unavailable",
    anomaly: source.anomaly || null,
    observationDate: source.observationDate ?? source.observation_date ?? null,
    imageUrl: source.imageUrl ?? source.image_url ?? null,
    summary: source.summary || "Satellite observations are available for this field.",
  };
}

export function useSatelliteHealth({ fieldId, enabled = true }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(Boolean(enabled));
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchSatelliteHealth = useCallback(
    async ({ silent = false } = {}) => {
      if (!enabled || !fieldId) return;

      if (mountedRef.current) {
        if (silent) setRefreshing(true);
        else setLoading(true);
        setError(null);
      }

      try {
        const payload = await request(`fields/${encodeURIComponent(fieldId)}/satellite-health`);
        
        if (mountedRef.current) {
          setData(normalizeSatelliteData(payload));
          setError(null);
        }
      } catch (err) {
        if (mountedRef.current) {
          setError({
            message: err.message || "Satellite health data could not be loaded.",
            code: err.status || "SATELLITE_HEALTH_FETCH_FAILED",
          });
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [enabled, fieldId]
  );

  useEffect(() => {
    fetchSatelliteHealth();
  }, [fetchSatelliteHealth]);

  return {
    data,
    loading,
    refreshing,
    error,
    refetch: () => fetchSatelliteHealth({ silent: true }),
  };
}
