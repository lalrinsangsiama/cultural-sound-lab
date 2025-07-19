"use client";

import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSessionTimeout } from '@/hooks/useSessionTimeout';
import { Clock, LogOut, RefreshCw } from 'lucide-react';

interface SessionTimeoutWarningProps {
  onExtend: () => void;
  onLogout: () => void;
}

export function SessionTimeoutWarning({ onExtend, onLogout }: SessionTimeoutWarningProps) {
  const { 
    timeRemainingFormatted, 
    showWarning, 
    extendSession, 
    endSession 
  } = useSessionTimeout({
    onWarning: () => {},
    onTimeout: onLogout,
  });

  const handleExtend = () => {
    extendSession();
    onExtend();
  };

  const handleLogout = () => {
    endSession();
    onLogout();
  };

  if (!showWarning) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-500" />
            <CardTitle>Session Expiring Soon</CardTitle>
          </div>
          <CardDescription>
            Your session will expire in {timeRemainingFormatted} due to inactivity.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              To protect your account, we automatically log out inactive users. 
              Click "Stay Logged In" to continue your session.
            </AlertDescription>
          </Alert>
          
          <div className="flex gap-3">
            <Button onClick={handleExtend} className="flex-1">
              <RefreshCw className="h-4 w-4 mr-2" />
              Stay Logged In
            </Button>
            
            <Button onClick={handleLogout} variant="outline">
              <LogOut className="h-4 w-4 mr-2" />
              Log Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function SessionTimeoutBanner() {
  const { timeRemainingFormatted, isExpiringSoon, extendSession } = useSessionTimeout();

  if (!isExpiringSoon) return null;

  return (
    <Alert className="border-orange-200 bg-orange-50">
      <Clock className="h-4 w-4 text-orange-600" />
      <AlertDescription className="flex items-center justify-between">
        <span className="text-orange-800">
          Session expires in {timeRemainingFormatted}
        </span>
        <Button size="sm" variant="outline" onClick={extendSession}>
          Extend Session
        </Button>
      </AlertDescription>
    </Alert>
  );
}