import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { GoogleOAuthProvider } from '@react-oauth/google';
import { EarthEngineProvider } from './features/auth/EarthEngineProvider';
import "./index.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID || import.meta.env.VITE_EE_CLIENT_ID || "missing-client-id.apps.googleusercontent.com"}>
      <EarthEngineProvider>
        <App />
      </EarthEngineProvider>
    </GoogleOAuthProvider>
  </StrictMode>,
);
