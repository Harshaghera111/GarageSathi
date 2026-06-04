/**
 * ErrorBoundary — GarageSathi
 *
 * C3 FIX: Global React Error Boundary.
 *
 * Wraps the entire route tree. If any lazily-loaded page or component throws
 * an unhandled exception (e.g. Firestore read failure, bad data shape), this
 * catches it and renders a friendly fallback instead of a blank white screen.
 *
 * Usage:
 *   <ErrorBoundary>
 *     <Suspense fallback={<Loader fullPage />}>
 *       <Routes>...</Routes>
 *     </Suspense>
 *   </ErrorBoundary>
 *
 * Future: Replace console.error with Sentry.captureException(error) here.
 */

import { Component } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render shows the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log to console for development. In production, forward to a crash reporter.
    console.error('[ErrorBoundary] Uncaught error:', error, errorInfo);
    this.setState({ errorInfo });
    // TODO Phase 5: Sentry.captureException(error, { extra: errorInfo });
  }

  handleRetry = () => {
    // Clear error state — React will attempt to re-render the child tree.
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleGoHome = () => {
    // Navigate to root and reset — works even without react-router access.
    window.location.href = '/';
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="min-h-screen bg-surface-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg border border-surface-200 max-w-md w-full p-8 text-center space-y-6">
          {/* Icon */}
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-gray-900">Something went wrong</h1>
            <p className="text-sm text-gray-500 leading-relaxed">
              An unexpected error occurred. Your data is safe — this is a display
              issue, not a data loss issue.
            </p>
          </div>

          {/* Error detail (dev mode only) */}
          {import.meta.env.DEV && this.state.error && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-left">
              <p className="text-xs font-mono text-red-700 break-words leading-relaxed">
                {this.state.error.toString()}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={this.handleRetry}
              className="flex-1 btn-primary flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
            <button
              onClick={this.handleGoHome}
              className="flex-1 btn-secondary flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" />
              Go Home
            </button>
          </div>

          <p className="text-xs text-gray-400">
            If this keeps happening, please contact support.
          </p>
        </div>
      </div>
    );
  }
}
