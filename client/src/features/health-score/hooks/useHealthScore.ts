import { useState, useEffect } from 'react';
import { FieldHealthScore } from '../types/health-score.types';
import { request } from '../../../services/apiClient';

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
        const scoreData = await request<FieldHealthScore>(`fields/${fieldId}/health-score`);

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
