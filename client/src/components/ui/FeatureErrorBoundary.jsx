import React, { Component } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

/**
 * FeatureErrorBoundary
 *
 * Wraps individual Field page sections so a failure in one feature
 * (e.g. satellite data, climate risk) doesn't crash the entire page.
 *
 * Usage:
 *   <FeatureErrorBoundary sectionName="Satellite Health">
 *     <FieldSatelliteWrapper fieldId={fieldId} />
 *   </FeatureErrorBoundary>
 */
export class FeatureErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // In production, send to error monitoring (Sentry, etc.)
    console.error(
      `[FeatureErrorBoundary] ${this.props.sectionName ?? "Unknown section"} failed:`,
      error,
      info.componentStack,
    );
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const { sectionName = "This section", compact = false } = this.props;

    if (compact) {
      return (
        <div className="flex items-center gap-2 p-3 bg-danger/5 border border-danger/20 text-danger text-sm rounded-lg">
          <AlertTriangle size={16} className="shrink-0" />
          <span className="flex-1 font-medium">
            {sectionName} could not load.
          </span>
          <button
            onClick={this.handleRetry}
            className="underline font-bold hover:no-underline text-xs"
          >
            Retry
          </button>
        </div>
      );
    }

    return (
      <div className="p-5 bg-surface border border-neutral rounded-xl">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-danger/10 rounded-lg text-danger shrink-0">
            <AlertTriangle size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm text-text mb-1">
              {sectionName} unavailable
            </h3>
            <p className="text-xs text-text-muted leading-relaxed">
              This section could not be loaded. The rest of your field dashboard
              is unaffected.
            </p>
            {process.env.NODE_ENV !== "production" && this.state.error && (
              <p className="text-xs font-mono text-danger/70 mt-2 truncate">
                {this.state.error.message}
              </p>
            )}
          </div>
          <button
            onClick={this.handleRetry}
            className="shrink-0 flex items-center gap-1 text-xs font-bold text-text-muted hover:text-text transition-colors"
          >
            <RefreshCw size={12} />
            Retry
          </button>
        </div>
      </div>
    );
  }
}
