import { useState, useEffect } from "react";
import { request } from "../../../services/apiClient";

export function useSatelliteHealth(fieldId) {
  const [data, setData] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!fieldId) return;

    let isMounted = true;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [latestData, timelineData] = await Promise.all([
          request(`fields/${fieldId}/satellite/latest`),
          request(`fields/${fieldId}/satellite/timeline`),
        ]);

        if (isMounted) {
          setData(latestData);
          setTimeline(timelineData.timeline || []);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Unknown error");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [fieldId]);

  return { data, timeline, loading, error };
}
