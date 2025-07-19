"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Search, 
  Music, 
  WifiOff, 
  Zap, 
  Upload, 
  Heart,
  Folder,
  CreditCard,
  Settings,
  RefreshCw 
} from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'secondary';
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon = Folder,
  title,
  description,
  action,
  secondaryAction,
  className,
}: EmptyStateProps) {
  return (
    <Card className={className}>
      <CardContent className="flex flex-col items-center justify-center text-center py-12">
        <div className="mb-4 p-3 bg-muted rounded-full">
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
        
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground mb-6 max-w-md">{description}</p>
        
        {action && (
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={action.onClick}
              variant={action.variant || 'default'}
            >
              {action.label}
            </Button>
            
            {secondaryAction && (
              <Button
                onClick={secondaryAction.onClick}
                variant="outline"
              >
                {secondaryAction.label}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function NoSearchResults({ 
  query, 
  onClearSearch, 
  onTryDifferentSearch 
}: { 
  query: string; 
  onClearSearch: () => void;
  onTryDifferentSearch: () => void;
}) {
  return (
    <EmptyState
      icon={Search}
      title="No results found"
      description={`We couldn't find any audio samples matching "${query}". Try adjusting your search terms or browse our categories.`}
      action={{
        label: "Clear Search",
        onClick: onClearSearch,
        variant: "outline"
      }}
      secondaryAction={{
        label: "Browse All",
        onClick: onTryDifferentSearch
      }}
    />
  );
}

export function NoAudioSamples({ onUpload }: { onUpload: () => void }) {
  return (
    <EmptyState
      icon={Music}
      title="No audio samples yet"
      description="Start building your audio library by uploading cultural sound samples and traditional music."
      action={{
        label: "Upload First Sample",
        onClick: onUpload
      }}
    />
  );
}

export function NoGenerations({ onCreateNew }: { onCreateNew: () => void }) {
  return (
    <EmptyState
      icon={Zap}
      title="No generations yet"
      description="Create your first AI-generated audio using our cultural sound samples as inspiration."
      action={{
        label: "Create Generation",
        onClick: onCreateNew
      }}
    />
  );
}

export function NoFavorites({ onBrowse }: { onBrowse: () => void }) {
  return (
    <EmptyState
      icon={Heart}
      title="No favorites saved"
      description="Save your favorite audio samples and generations to easily find them later."
      action={{
        label: "Browse Audio Library",
        onClick: onBrowse,
        variant: "outline"
      }}
    />
  );
}

export function OfflineContent({ onRetry }: { onRetry: () => void }) {
  return (
    <EmptyState
      icon={WifiOff}
      title="You're offline"
      description="This content requires an internet connection. Please check your connection and try again."
      action={{
        label: "Try Again",
        onClick: onRetry,
        variant: "outline"
      }}
    />
  );
}

export function PaymentRequired({ onUpgrade }: { onUpgrade: () => void }) {
  return (
    <EmptyState
      icon={CreditCard}
      title="Premium feature"
      description="This feature requires a premium subscription. Upgrade to unlock unlimited generations and advanced features."
      action={{
        label: "Upgrade Now",
        onClick: onUpgrade
      }}
    />
  );
}

export function ConfigurationRequired({ onConfigure }: { onConfigure: () => void }) {
  return (
    <EmptyState
      icon={Settings}
      title="Setup required"
      description="Complete your account setup to start using this feature."
      action={{
        label: "Complete Setup",
        onClick: onConfigure
      }}
    />
  );
}