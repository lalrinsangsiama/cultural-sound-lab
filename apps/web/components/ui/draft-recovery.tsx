"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, Trash2, Clock, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface DraftData {
  data: unknown;
  timestamp: number;
  version: string;
}

interface DraftRecoveryProps {
  storageKey: string;
  onRestore: (data: unknown) => void;
  onDiscard: () => void;
  className?: string;
}

export function DraftRecovery({ storageKey, onRestore, onDiscard, className }: DraftRecoveryProps) {
  const [draft, setDraft] = useState<DraftData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(`autosave_${storageKey}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        setDraft(parsed);
      }
    } catch (error) {
      console.error('Failed to load draft:', error);
    }
  }, [storageKey]);

  const handleRestore = async () => {
    if (!draft) return;

    setIsLoading(true);
    try {
      onRestore(draft.data);
      localStorage.removeItem(`autosave_${storageKey}`);
      setDraft(null);
    } catch (error) {
      console.error('Failed to restore draft:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDiscard = () => {
    localStorage.removeItem(`autosave_${storageKey}`);
    setDraft(null);
    onDiscard();
  };

  if (!draft) return null;

  const timeAgo = formatDistanceToNow(new Date(draft.timestamp), { addSuffix: true });

  return (
    <Alert className={className}>
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        <div className="space-y-3">
          <div>
            We found an unsaved draft from <span className="font-medium">{timeAgo}</span>. 
            Would you like to restore it?
          </div>
          
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleRestore}
              disabled={isLoading}
              className="flex items-center gap-1"
            >
              {isLoading ? (
                <RefreshCw className="h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3" />
              )}
              Restore Draft
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={handleDiscard}
              disabled={isLoading}
              className="flex items-center gap-1"
            >
              <Trash2 className="h-3 w-3" />
              Discard
            </Button>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}

interface AutosaveIndicatorProps {
  lastSaved: Date | null;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  error: Error | null;
}

export function AutosaveIndicator({ lastSaved, isSaving, hasUnsavedChanges, error }: AutosaveIndicatorProps) {
  if (error) {
    return (
      <div className="flex items-center gap-2 text-sm text-destructive">
        <AlertTriangle className="h-4 w-4" />
        <span>Failed to save: {error.message}</span>
      </div>
    );
  }

  if (isSaving) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <RefreshCw className="h-4 w-4 animate-spin" />
        <span>Saving...</span>
      </div>
    );
  }

  if (hasUnsavedChanges) {
    return (
      <div className="flex items-center gap-2 text-sm text-orange-600">
        <Clock className="h-4 w-4" />
        <span>Unsaved changes</span>
      </div>
    );
  }

  if (lastSaved) {
    const timeAgo = formatDistanceToNow(lastSaved, { addSuffix: true });
    return (
      <div className="flex items-center gap-2 text-sm text-green-600">
        <Clock className="h-4 w-4" />
        <span>Saved {timeAgo}</span>
      </div>
    );
  }

  return null;
}

interface DraftManagementProps {
  storageKey: string;
  children: React.ReactNode;
  onRestore?: (data: unknown) => void;
  onDiscard?: () => void;
}

export function DraftManagement({ storageKey, children, onRestore, onDiscard }: DraftManagementProps) {
  const [showRecovery, setShowRecovery] = useState(true);

  const handleRestore = (data: unknown) => {
    setShowRecovery(false);
    onRestore?.(data);
  };

  const handleDiscard = () => {
    setShowRecovery(false);
    onDiscard?.();
  };

  return (
    <div className="space-y-4">
      {showRecovery && (
        <DraftRecovery
          storageKey={storageKey}
          onRestore={handleRestore}
          onDiscard={handleDiscard}
        />
      )}
      {children}
    </div>
  );
}