import { useState, useEffect } from 'react';
import { FieldHealthScore } from '../types/health-score.types';

const API_URL = 'http://localhost:8000/api';

export function useHealthScore(fieldId: string | undefined) {
  const [data, setData] = useState<FieldHealthScore | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!fieldId) return;

    let isMounted = true;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`${API_URL}/fields/${fieldId}/health-score`);

        if (!response.ok) {
          throw new Error('Failed to fetch field health score');
        }

        const scoreData = await response.json();

        if (isMounted) {
          setData(scoreData);
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

  return { data, loading, error };
}
