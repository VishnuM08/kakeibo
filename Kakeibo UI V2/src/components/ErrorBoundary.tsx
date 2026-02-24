/**
 * ERROR BOUNDARY COMPONENT
 * 
 * React Error Boundary to catch and handle errors gracefully in the component tree.
 * Prevents the entire app from crashing when a component throws an error.
 * 
 * FEATURES:
 * - Catches JavaScript errors anywhere in child component tree
 * - Logs error details for debugging
 * - Shows fallback UI to users
 * - Allows users to recover from errors
 * - Integrates with error monitoring services (Sentry, etc.)
 * 
 * USAGE:
 * Wrap your app or specific sections:
 * 
 * <ErrorBoundary>
 *   <YourApp />
 * </ErrorBoundary>
 * 
 * PRODUCTION RECOMMENDATIONS:
 * - Integrate with Sentry or similar error tracking service
 * - Log errors to your backend for analysis
 * - Show user-friendly error messages (no stack traces)
 * - Provide recovery actions (refresh, go home, contact support)
 * 
 * LIMITATIONS:
 * Error boundaries do NOT catch errors in:
 * - Event handlers (use try-catch)
 * - Asynchronous code (setTimeout, promises)
 * - Server-side rendering
 * - Errors in the error boundary itself
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, MessageCircle } from 'lucide-react';

// ================================
// TYPE DEFINITIONS
// ================================

interface Props {
  children: ReactNode;
  fallback?: ReactNode; // Custom fallback UI
  onError?: (error: Error, errorInfo: ErrorInfo) => void; // Custom error handler
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

// ================================
// ERROR BOUNDARY COMPONENT
// ================================

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  /**
   * Static method called when an error is thrown
   * Updates state to trigger fallback UI
   */
  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  /**
   * Called after an error has been caught
   * Use for error logging and reporting
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error details to console
    console.error('ErrorBoundary caught an error:', error);
    console.error('Error info:', errorInfo);

    // Store error info in state
    this.setState({
      errorInfo,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // TODO: PRODUCTION - Send error to monitoring service
    // Example with Sentry:
    // import * as Sentry from '@sentry/react';
    // Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } });

    // TODO: PRODUCTION - Log to backend
    // logErrorToBackend({
    //   message: error.message,
    //   stack: error.stack,
    //   componentStack: errorInfo.componentStack,
    //   timestamp: new Date().toISOString(),
    //   userAgent: navigator.userAgent,
    // });
  }

  /**
   * Reset error state and try again
   */
  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  /**
   * Reload the entire page
   */
  handleReload = (): void => {
    window.location.reload();
  };

  /**
   * Navigate to home page
   */
  handleGoHome = (): void => {
    window.location.href = '/';
  };

  /**
   * Open support/feedback
   */
  handleContactSupport = (): void => {
    // TODO: Replace with your support email/link
    window.location.href = 'mailto:support@kakeibo.app?subject=Error Report';
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-6">
          <div className="max-w-md w-full">
            {/* Error Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-10 h-10 text-red-600" strokeWidth={2} />
              </div>
            </div>

            {/* Error Message */}
            <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-3">
                Oops! Something went wrong
              </h1>
              <p className="text-gray-600 mb-6">
                We're sorry for the inconvenience. The app encountered an unexpected error.
              </p>

              {/* Error Details (Development only) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-left">
                  <p className="text-xs font-mono text-red-800 break-all">
                    <strong>Error:</strong> {this.state.error.message}
                  </p>
                  {this.state.error.stack && (
                    <details className="mt-2">
                      <summary className="text-xs text-red-700 cursor-pointer">
                        Stack trace
                      </summary>
                      <pre className="text-xs text-red-700 mt-2 overflow-auto max-h-40">
                        {this.state.error.stack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={this.handleReset}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-5 h-5" />
                  Try Again
                </button>

                <button
                  onClick={this.handleReload}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-5 h-5" />
                  Reload Page
                </button>

                <button
                  onClick={this.handleGoHome}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <Home className="w-5 h-5" />
                  Go to Home
                </button>

                <button
                  onClick={this.handleContactSupport}
                  className="w-full text-blue-600 hover:text-blue-700 font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-5 h-5" />
                  Contact Support
                </button>
              </div>

              {/* Help Text */}
              <p className="text-xs text-gray-500 mt-6">
                If this problem persists, please contact our support team with details about what you were doing when the error occurred.
              </p>
            </div>
          </div>
        </div>
      );
    }

    // No error, render children normally
    return this.props.children;
  }
}

// ================================
// CUSTOM ERROR BOUNDARY VARIANTS
// ================================

/**
 * Minimal Error Boundary for small sections
 * Shows inline error message instead of full-screen
 */
export class InlineErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('InlineErrorBoundary caught error:', error, errorInfo);
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 my-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-red-900 mb-1">
                Something went wrong
              </h3>
              <p className="text-sm text-red-700 mb-3">
                {this.state.error?.message || 'An unexpected error occurred'}
              </p>
              <button
                onClick={this.handleReset}
                className="text-sm font-semibold text-red-600 hover:text-red-700 flex items-center gap-1"
              >
                <RefreshCw className="w-4 h-4" />
                Try again
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Silent Error Boundary
 * Catches errors but doesn't show UI, useful for non-critical features
 */
export class SilentErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('SilentErrorBoundary caught error:', error, errorInfo);
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return null; // Render nothing
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
