import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
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
import { MarketPrices } from "./pages/MarketPrices";
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
 * GlobalErrorBoundary
 *
 * Catches unhandled render errors so the whole app doesn't go blank.
 * Accepts a `resetKey` prop — when this value changes (e.g. on navigation),
 * the error state is automatically cleared so the user can keep using the app.
 */
class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("[GlobalErrorBoundary] App crashed:", error, info);
  }

  // Auto-reset when the user navigates to a different route.
  componentDidUpdate(prevProps) {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false, error: null });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "2rem", color: "#ef4444", fontFamily: "system-ui, sans-serif" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "0.5rem" }}>
            Something went wrong.
          </h1>
          <p style={{ color: "#6b7280" }}>Please navigate to another page or refresh.</p>
          {process.env.NODE_ENV !== "production" && (
            <pre style={{ marginTop: "1rem", padding: "1rem", background: "#fee2e2", borderRadius: "0.5rem", overflowX: "auto" }}>
              {this.state.error?.toString()}
            </pre>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * LocationAwareErrorBoundary
 *
 * Must be a function component so it can use useLocation.
 * Passes the current pathname as `resetKey` to GlobalErrorBoundary
 * so errors are cleared automatically on every route change.
 */
function LocationAwareErrorBoundary({ children }) {
  const location = useLocation();
  return (
    <GlobalErrorBoundary resetKey={location.pathname}>
      {children}
    </GlobalErrorBoundary>
  );
}

/**
 * LoginPageWrapper — redirects to the intended page (or "/") after successful login.
 * Must be inside <Router> so useNavigate/useLocation are available.
 */
function LoginPageWrapper() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  return <LoginPage onSuccess={() => navigate(from, { replace: true })} />;
}

/**
 * AppRoutes — all route definitions.
 * AuthProvider is inside Router so hooks work everywhere.
 */
function AppRoutes() {
  return (
    <AuthProvider>
      <LocationAwareErrorBoundary>
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
            <Route path="market-prices" element={<MarketPrices />} />
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
      </LocationAwareErrorBoundary>
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
