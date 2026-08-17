import React, { createContext, useContext, useState, useEffect } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import ee from '@google/earthengine';

const EarthEngineContext = createContext({
  isAuthenticated: false,
  isInitializing: false,
  error: null,
  login: () => {},
  logout: () => {}
});

export const useEarthEngine = () => useContext(EarthEngineContext);

export const EarthEngineProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState(null);

  // Initialize Earth Engine with the obtained token
  const initializeEarthEngine = async (token) => {
    setIsInitializing(true);
    setError(null);
    try {
      await new Promise((resolve, reject) => {
        ee.data.setAuthToken(
          '',
          'Bearer',
          token,
          3600,
          [],
          () => {
            ee.initialize(
              null,
              null,
              () => {
                console.log('Earth Engine initialized successfully.');
                setIsAuthenticated(true);
                resolve();
              },
              (e) => {
                console.error('Earth Engine initialization failed:', e);
                setError(e.toString());
                reject(e);
              }
            );
          },
          false
        );
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsInitializing(false);
    }
  };

  const login = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      console.log('OAuth Success, initializing EE...');
      initializeEarthEngine(tokenResponse.access_token);
    },
    onError: (errorResponse) => {
      console.error('OAuth Error:', errorResponse);
      setError('Google Login failed');
    },
    scope: 'https://www.googleapis.com/auth/earthengine'
  });

  const logout = () => {
    // There isn't a direct logout for EE JS SDK token, so we just clear state
    setIsAuthenticated(false);
    ee.data.clearAuthToken();
  };

  // Check if we already have a valid token initialized (unlikely on hard refresh without persistence)
  // For production, we'd want to persist the token and its expiry in localStorage.
  
  return (
    <EarthEngineContext.Provider value={{ isAuthenticated, isInitializing, error, login, logout }}>
      {children}
    </EarthEngineContext.Provider>
  );
};
