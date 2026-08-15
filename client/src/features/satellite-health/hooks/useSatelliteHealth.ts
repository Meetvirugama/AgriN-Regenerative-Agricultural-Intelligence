import { useState, useEffect } from 'react';
import { SatelliteHealthData, FieldHealthTrend } from '../types/satellite.types';
import { request } from '../../../services/apiClient';

export function useSatelliteHealth(fieldId: string | undefined) {
  const [data, setData] = useState<SatelliteHealthData | null>(null);
  const [timeline, setTimeline] = useState<FieldHealthTrend[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!fieldId) return;

    let isMounted = true;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const [latestData, timelineData] = await Promise.all([
          request<SatelliteHealthData>(`fields/${fieldId}/satellite/latest`),
          request<{timeline: FieldHealthTrend[]}>(`fields/${fieldId}/satellite/timeline`)
        ]);

        if (isMounted) {
          setData(latestData);
          setTimeline(timelineData.timeline || []);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Unknown error');
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
