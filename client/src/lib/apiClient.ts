/**
 * Central API base URL — override with VITE_API_URL env variable for staging/production.
 */
export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
