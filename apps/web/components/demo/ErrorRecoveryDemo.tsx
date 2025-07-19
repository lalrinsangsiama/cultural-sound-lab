'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { enhancedToast, ToastContainer, useEnhancedToast } from '@/components/ui/enhanced-toast';
import { NetworkStatusIndicator, NetworkStatusBadge } from '@/components/ui/network-status-indicator';
import { EnhancedErrorBoundary } from '@/components/error/enhanced-error-boundary';
import { useEnhancedMutation, useEnhancedQuery } from '@/hooks/useEnhancedApi';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { ApiError } from '@/lib/api/error-handling';
import { Wifi, WifiOff, AlertCircle, Clock, CheckCircle2, Bug } from 'lucide-react';

// Simulate different types of errors
const simulateError = (type: string) => {
  switch (type) {
    case 'network':
      const networkError = new Error('Failed to fetch');
      networkError.name = 'NetworkError';
      throw networkError;
    case 'api-500':
      throw new ApiError('Internal server error', 500, 'INTERNAL_ERROR');
    case 'api-429':
      throw new ApiError('Too many requests', 429, 'RATE_LIMIT');
    case 'api-401':
      throw new ApiError('Unauthorized access', 401, 'UNAUTHORIZED');
    case 'component':
      throw new Error('Component render error');
    default:
      throw new Error('Unknown error occurred');
  }
};

function ErrorTriggerComponent({ errorType }: { errorType: string }) {
  if (errorType === 'component') {
    simulateError('component');
  }
  return <div>Component rendered successfully</div>;
}

export function ErrorRecoveryDemo() {
  const { toasts, dismissToast } = useEnhancedToast();
  const { handleError } = useErrorHandler();
  const [componentError, setComponentError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Demo mutation with retry capabilities
  const { mutate: demoMutation, isLoading, error } = useEnhancedMutation(
    async (errorType: string) => {
      if (errorType !== 'success') {
        simulateError(errorType);
      }
      return { success: true, message: 'Operation completed successfully!' };
    },
    {
      onSuccess: (data) => {
        enhancedToast.success(data.message);
        setRetryCount(0);
      },
      onError: (error) => {
        setRetryCount(prev => prev + 1);
      }
    }
  );

  // Demo query with automatic retry
  const { data: queryData, isLoading: queryLoading, refetch } = useEnhancedQuery(
    ['demo-query'],
    async () => {
      // Simulate random failures
      if (Math.random() > 0.7) {
        simulateError('network');
      }
      return { data: 'Query executed successfully', timestamp: new Date().toISOString() };
    },
    {
      enabled: false, // Manual trigger
      staleTime: 5000,
    }
  );

  const handleNetworkError = () => {
    enhancedToast.networkError(
      'Connection lost while processing your request',
      () => {
        enhancedToast.loading('Retrying connection...');
        setTimeout(() => {
          enhancedToast.success('Connection restored!');
        }, 2000);
      }
    );
  };

  const handleRetryableError = () => {
    const currentRetry = retryCount;
    enhancedToast.retryableError(
      'Server temporarily unavailable',
      () => {
        setRetryCount(prev => prev + 1);
        if (currentRetry < 2) {
          setTimeout(() => handleRetryableError(), 1000);
        } else {
          enhancedToast.success('Operation completed after retry!');
          setRetryCount(0);
        }
      },
      currentRetry,
      3
    );
  };

  const handleOfflineQueue = () => {
    enhancedToast.offlineQueue('Your audio generation has been queued and will process when you\'re back online');
  };

  const handleApiError = (type: string) => {
    try {
      demoMutation(type);
    } catch (error) {
      handleError(error, {
        retryAction: () => demoMutation(type),
        retryCount,
        maxRetries: 3,
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Error Recovery & UX Improvements Demo
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            This demo showcases the enhanced error handling, retry mechanisms, offline support, 
            and improved user feedback systems implemented in the Cultural Sound Lab platform.
          </p>
        </div>

        {/* Network Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wifi className="h-5 w-5" />
              Network Status & Monitoring
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <NetworkStatusBadge />
              <span className="text-sm text-gray-600">Real-time network status indicator</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                variant="outline" 
                onClick={handleNetworkError}
                className="flex items-center gap-2"
              >
                <WifiOff className="h-4 w-4" />
                Simulate Network Error
              </Button>
              
              <Button 
                variant="outline" 
                onClick={handleOfflineQueue}
                className="flex items-center gap-2"
              >
                <Clock className="h-4 w-4" />
                Simulate Offline Queue
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => refetch()}
                disabled={queryLoading}
                className="flex items-center gap-2"
              >
                <CheckCircle2 className="h-4 w-4" />
                Test Auto Retry Query
              </Button>
            </div>

            {queryData && (
              <div className="p-3 bg-green-50 border border-green-200 rounded text-sm">
                <strong>Query Result:</strong> {queryData.data} 
                <br />
                <span className="text-gray-600">Timestamp: {queryData.timestamp}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* API Error Handling */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              API Error Handling & Retry Logic
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button 
                variant="outline" 
                onClick={() => handleApiError('network')}
                disabled={isLoading}
                size="sm"
              >
                Network Error
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => handleApiError('api-500')}
                disabled={isLoading}
                size="sm"
              >
                Server Error (500)
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => handleApiError('api-429')}
                disabled={isLoading}
                size="sm"
              >
                Rate Limit (429)
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => handleApiError('api-401')}
                disabled={isLoading}
                size="sm"
              >
                Unauthorized (401)
              </Button>
            </div>

            <Button 
              onClick={handleRetryableError}
              className="w-full"
            >
              Demonstrate Smart Retry Logic
            </Button>

            {retryCount > 0 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
                <strong>Retry Count:</strong> {retryCount} / 3
              </div>
            )}
          </CardContent>
        </Card>

        {/* Component Error Boundary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bug className="h-5 w-5" />
              Component Error Boundary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setComponentError('component')}
              >
                Trigger Component Error
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => setComponentError(null)}
              >
                Reset Component
              </Button>
            </div>

            <div className="border border-gray-200 rounded p-4 min-h-[100px] bg-white">
              <EnhancedErrorBoundary showErrorDetails={true}>
                <ErrorTriggerComponent errorType={componentError || ''} />
              </EnhancedErrorBoundary>
            </div>
          </CardContent>
        </Card>

        {/* Toast Demos */}
        <Card>
          <CardHeader>
            <CardTitle>Enhanced Toast Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button 
                variant="outline" 
                onClick={() => enhancedToast.success('Operation completed successfully!')}
                size="sm"
              >
                Success Toast
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => enhancedToast.error('Something went wrong', {
                  actions: [{
                    label: 'Try Again',
                    onClick: () => enhancedToast.success('Retry successful!')
                  }]
                })}
                size="sm"
              >
                Error with Action
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => {
                  const loadingId = enhancedToast.loading('Processing your request...');
                  setTimeout(() => {
                    enhancedToast.dismiss(loadingId);
                    enhancedToast.success('Processing complete!');
                  }, 3000);
                }}
                size="sm"
              >
                Loading Toast
              </Button>
              
              <Button 
                variant="destructive"
                onClick={() => enhancedToast.dismissAll()}
                size="sm"
              >
                Clear All Toasts
              </Button>
            </div>

            <div className="text-sm text-gray-600">
              <strong>Active Toasts:</strong> {toasts.length}
            </div>
          </CardContent>
        </Card>

        {/* Features Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Implemented Features Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">Error Recovery</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Automatic retry with exponential backoff</li>
                  <li>• Network error detection and handling</li>
                  <li>• Smart retry for transient failures</li>
                  <li>• Request cancellation support</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">Offline Support</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Request queuing when offline</li>
                  <li>• Automatic sync when reconnected</li>
                  <li>• Persistent local storage</li>
                  <li>• Connection status monitoring</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">User Experience</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Enhanced error messages</li>
                  <li>• Interactive toast notifications</li>
                  <li>• Progress indicators</li>
                  <li>• Recovery action buttons</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">Error Boundaries</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Component-level error catching</li>
                  <li>• Graceful fallback UI</li>
                  <li>• Error reporting integration</li>
                  <li>• Automatic error recovery options</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Network Status Indicator */}
      <NetworkStatusIndicator showDetails={true} />

      {/* Toast Container */}
      <ToastContainer 
        toasts={toasts} 
        onDismiss={dismissToast}
        position="top-right"
      />
    </div>
  );
}