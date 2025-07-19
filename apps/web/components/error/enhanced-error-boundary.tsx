'use client';

import React, { Component, ReactNode } from 'react';
import { captureApiError } from '@/lib/api/error-handling';
import { AlertTriangle, RefreshCw, Home, Bug, Wifi } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  showErrorDetails?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorId: string | null;
  isRetrying: boolean;
  retryCount: number;
}

export class EnhancedErrorBoundary extends Component<Props, State> {
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorId: null,
      isRetrying: false,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Capture error with Sentry and our error handling system
    captureApiError(error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
      retryCount: this.state.retryCount,
    });

    this.props.onError?.(error, errorInfo);
  }

  private handleRetry = async () => {
    this.setState({ isRetrying: true });

    // Add a slight delay to make the retry feel intentional
    await new Promise(resolve => setTimeout(resolve, 500));

    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorId: null,
      isRetrying: false,
      retryCount: prevState.retryCount + 1,
    }));
  };

  private handleAutoRetry = () => {
    this.retryTimeoutId = setTimeout(() => {
      this.handleRetry();
    }, 3000);
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleReportBug = () => {
    const { error, errorId } = this.state;
    const subject = encodeURIComponent(`Bug Report: ${error?.name || 'Application Error'}`);
    const body = encodeURIComponent(`
Error ID: ${errorId}
Error Message: ${error?.message || 'Unknown error'}
URL: ${window.location.href}
User Agent: ${navigator.userAgent}
Timestamp: ${new Date().toISOString()}

Please describe what you were doing when this error occurred:
    `);
    
    window.open(`mailto:support@culturalsoundlab.com?subject=${subject}&body=${body}`);
  };

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    if (this.props.fallback) {
      return this.props.fallback;
    }

    const { error, errorId, isRetrying, retryCount } = this.state;
    const isNetworkError = error?.message?.includes('Network') || error?.name === 'NetworkError';
    const maxRetries = 3;
    const canRetry = retryCount < maxRetries;

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="mb-6">
            {isNetworkError ? (
              <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Wifi className="w-6 h-6 text-blue-600" />
              </div>
            ) : (
              <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            )}
            
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              {isNetworkError ? 'Connection Problem' : 'Something went wrong'}
            </h1>
            
            <p className="text-gray-600 text-sm">
              {isNetworkError 
                ? 'Please check your internet connection and try again.'
                : 'We encountered an unexpected error. Our team has been notified.'
              }
            </p>

            {this.props.showErrorDetails && error && (
              <details className="mt-4 text-left">
                <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
                  Error Details
                </summary>
                <div className="mt-2 p-3 bg-gray-50 rounded border text-xs font-mono text-gray-700 whitespace-pre-wrap">
                  {error.stack || error.message}
                </div>
                {errorId && (
                  <p className="text-xs text-gray-500 mt-1">Error ID: {errorId}</p>
                )}
              </details>
            )}
          </div>

          <div className="space-y-3">
            {canRetry && (
              <Button 
                onClick={this.handleRetry}
                disabled={isRetrying}
                className="w-full"
                variant={isNetworkError ? "default" : "outline"}
              >
                {isRetrying ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Retrying...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again
                  </>
                )}
              </Button>
            )}

            {retryCount >= maxRetries && (
              <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded border">
                Multiple retry attempts failed. Please try reloading the page.
              </div>
            )}

            <div className="flex gap-2">
              <Button 
                onClick={this.handleReload}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reload Page
              </Button>
              
              <Button 
                onClick={this.handleGoHome}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Button>
            </div>

            {!isNetworkError && (
              <Button 
                onClick={this.handleReportBug}
                variant="ghost"
                size="sm"
                className="w-full text-gray-500 hover:text-gray-700"
              >
                <Bug className="w-4 h-4 mr-2" />
                Report this issue
              </Button>
            )}
          </div>

          {isNetworkError && (
            <div className="mt-4 text-xs text-gray-500">
              <p>This might be a temporary network issue.</p>
              <p>Your unsaved changes are protected and will be restored when you reconnect.</p>
            </div>
          )}
        </div>
      </div>
    );
  }
}

// Convenience wrapper for functional components
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <EnhancedErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </EnhancedErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
}