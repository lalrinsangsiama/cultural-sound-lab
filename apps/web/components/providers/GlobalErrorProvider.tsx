"use client";

import { ReactNode } from 'react';
import { ErrorProvider } from './ErrorProvider';
import { NetworkStatusIndicator } from '@/components/ui/network-status';
import { BrowserCompatibilityWarning } from '@/components/ui/browser-compatibility-warning';
import { SessionTimeoutBanner } from '@/components/ui/session-timeout-warning';

interface GlobalErrorProviderProps {
  children: ReactNode;
}

export function GlobalErrorProvider({ children }: GlobalErrorProviderProps) {
  return (
    <ErrorProvider>
      <div className="min-h-screen flex flex-col">
        {/* Global notifications */}
        <div className="fixed top-0 left-0 right-0 z-50 space-y-2 p-4 pointer-events-none">
          <div className="pointer-events-auto">
            <NetworkStatusIndicator />
          </div>
          <div className="pointer-events-auto">
            <BrowserCompatibilityWarning />
          </div>
          <div className="pointer-events-auto">
            <SessionTimeoutBanner />
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 pt-4">
          {children}
        </div>
      </div>
    </ErrorProvider>
  );
}