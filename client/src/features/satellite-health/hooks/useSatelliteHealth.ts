import { useState, useEffect } from 'react';
import { SatelliteHealthData, FieldHealthTrend, AnomalyFlag } from '../types/satellite.types';

const API_URL = 'http://localhost:8000/api';

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
        const [latestRes, timelineRes] = await Promise.all([
          fetch(`${API_URL}/fields/${fieldId}/satellite/latest`),
          fetch(`${API_URL}/fields/${fieldId}/satellite/timeline`)
        ]);

        if (!latestRes.ok || !timelineRes.ok) {
          throw new Error('Failed to fetch satellite data');
        }

        const latestData = await latestRes.json();
        const timelineData = await timelineRes.json();

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
