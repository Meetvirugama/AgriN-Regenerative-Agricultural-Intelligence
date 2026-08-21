import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
import { FarmerShell } from "./app/FarmerShell";
import { ExtensionShell } from "./app/ExtensionShell";
import { Home } from "./pages/Home";
import { Field } from "./pages/Field";
import { MyFields } from "./pages/MyFields";
import { Intelligence } from "./pages/Intelligence";
import { Ask } from "./pages/Ask";
import { Alerts } from "./pages/Alerts";
import { Diagnosis } from "./pages/Diagnosis";
import { Profile } from "./pages/Profile";
import { Settings } from "./pages/Settings";
import { AddFieldStep1Location } from "./features/field-management/components/AddFieldStep1Location";
import { AddFieldStep2Boundary } from "./features/field-management/components/AddFieldStep2Boundary";
import { AddFieldStep3Details } from "./features/field-management/components/AddFieldStep3Details";
import { Onboarding } from "./pages/Onboarding";
import { ExtensionDashboard } from "./features/escalation-dashboard";
import { AuthProvider } from "./app/providers/AuthProvider";
import { LoginPage } from "./features/auth/components/LoginPage";
import { ProtectedRoute } from "./app/ProtectedRoute";

/**
 * LoginPageWrapper — redirects to "/" after successful login.
 * Must be inside <Router> so useNavigate is available.
 */
function LoginPageWrapper() {
  const navigate = useNavigate();
  return <LoginPage onSuccess={() => navigate("/", { replace: true })} />;
}

/**
 * AppRoutes — all route definitions.
 * AuthProvider is inside Router so hooks work everywhere.
 */
function AppRoutes() {
  return (
    <AuthProvider>
      <Routes>
        {/* Login — redirect away if already authenticated */}
        <Route
          path="/login"
          element={
            <ProtectedRoute redirectIfAuthenticated>
              <LoginPageWrapper />
            </ProtectedRoute>
          }
        />

        {/* Farmer routes — protected */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <FarmerShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<Home />} />
          <Route path="onboarding" element={<Onboarding />} />
          <Route path="intelligence" element={<Intelligence />} />
          <Route path="ask" element={<Ask />} />
          <Route path="alerts" element={<Alerts />} />
          <Route path="diagnosis" element={<Diagnosis />} />
          <Route path="profile" element={<Profile />} />
          <Route path="settings" element={<Settings />} />
          <Route path="fields">
            <Route index element={<MyFields />} />
            {/* Add Field — 3 separate pages, connected by URL params */}
            <Route path="add" element={<Navigate to="/fields/add/location" replace />} />
            <Route path="add/location" element={<AddFieldStep1Location />} />
            <Route path="add/boundary" element={<AddFieldStep2Boundary />} />
            <Route path="add/details" element={<AddFieldStep3Details />} />
            <Route path=":fieldId" element={<Field />} />
          </Route>
        </Route>

        {/* Extension routes — protected */}
        <Route
          path="/extension"
          element={
            <ProtectedRoute>
              <ExtensionShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<ExtensionDashboard />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

export default App;
