import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
} from "react-router-dom";
import { FarmerShell } from "./app/FarmerShell";
import { ExtensionShell } from "./app/ExtensionShell";
import { Home } from "./pages/Home";
import { Field } from "./pages/Field";
import { MyFields } from "./pages/MyFields";
import { AddFieldWizard } from "./features/field-management/components/AddFieldWizard";
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
          <Route path="fields">
            <Route index element={<MyFields />} />
            <Route path="add" element={<AddFieldWizard />} />
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
