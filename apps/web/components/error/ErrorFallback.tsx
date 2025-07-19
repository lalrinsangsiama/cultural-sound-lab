"use client";

import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, Home, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
  minimal?: boolean;
}

export function ErrorFallback({ error, resetError, minimal = false }: ErrorFallbackProps) {
  const router = useRouter();

  if (minimal) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <AlertCircle className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Something went wrong</p>
        <Button onClick={resetError} size="sm" variant="outline">
          <RefreshCw className="h-3 w-3 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 space-y-6">
      <div className="flex flex-col items-center space-y-4 text-center">
        <div className="p-3 bg-destructive/10 rounded-full">
          <AlertCircle className="h-10 w-10 text-destructive" />
        </div>
        <div className="space-y-2 max-w-md">
          <h2 className="text-xl font-semibold">Oops! Something went wrong</h2>
          <p className="text-sm text-muted-foreground">
            We encountered an unexpected error. Don't worry, we've been notified and are working on it.
          </p>
        </div>
      </div>

      {process.env.NODE_ENV === 'development' && (
        <details className="max-w-lg w-full">
          <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
            Show error details
          </summary>
          <div className="mt-2 p-4 bg-muted rounded-lg">
            <p className="text-sm font-mono text-destructive">{error.message}</p>
            {error.stack && (
              <pre className="mt-2 text-xs text-muted-foreground overflow-auto max-h-32">
                {error.stack}
              </pre>
            )}
          </div>
        </details>
      )}

      <div className="flex flex-wrap gap-3 justify-center">
        <Button onClick={resetError} variant="default" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
        <Button
          onClick={() => router.back()}
          variant="outline"
          size="sm"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>
        <Link href="/">
          <Button variant="outline" size="sm">
            <Home className="h-4 w-4 mr-2" />
            Home
          </Button>
        </Link>
      </div>
    </div>
  );
}