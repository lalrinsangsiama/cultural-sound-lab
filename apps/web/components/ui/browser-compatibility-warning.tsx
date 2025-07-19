"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useBrowserCompatibility } from '@/hooks/useBrowserCompatibility';
import { 
  AlertTriangle, 
  X, 
  ExternalLink, 
  Monitor,
  Download,
  Info 
} from 'lucide-react';

export function BrowserCompatibilityWarning() {
  const [dismissed, setDismissed] = useState(false);
  const { 
    isSupported, 
    browser, 
    version, 
    warnings, 
    unsupportedFeatures, 
    recommendations 
  } = useBrowserCompatibility();

  if (dismissed || (isSupported && warnings.length === 0)) {
    return null;
  }

  const severity = !isSupported ? 'high' : warnings.length > 2 ? 'medium' : 'low';

  if (severity === 'low' && warnings.length <= 1) {
    return (
      <Alert className="border-orange-200 bg-orange-50">
        <Info className="h-4 w-4 text-orange-600" />
        <AlertDescription className="flex items-center justify-between">
          <span className="text-orange-800">{warnings[0]}</span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setDismissed(true)}
          >
            <X className="h-4 w-4" />
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className={`border-${severity === 'high' ? 'destructive' : 'orange-200'} ${severity === 'high' ? 'bg-destructive/5' : 'bg-orange-50'}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className={`h-5 w-5 ${severity === 'high' ? 'text-destructive' : 'text-orange-600'}`} />
            <CardTitle className={severity === 'high' ? 'text-destructive' : 'text-orange-800'}>
              {!isSupported ? 'Browser Not Supported' : 'Browser Compatibility Warning'}
            </CardTitle>
            <Badge variant={severity === 'high' ? 'destructive' : 'secondary'}>
              {browser} {version}
            </Badge>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setDismissed(true)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <CardDescription>
          {!isSupported 
            ? 'Your browser does not support the features required for Cultural Sound Lab.'
            : 'Some features may not work optimally in your current browser.'
          }
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {unsupportedFeatures.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Unsupported Features:</h4>
            <div className="flex flex-wrap gap-2">
              {unsupportedFeatures.map((feature) => (
                <Badge key={feature} variant="destructive">
                  {feature}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {warnings.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Potential Issues:</h4>
            <ul className="text-sm space-y-1">
              {warnings.map((warning, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-orange-500 mt-0.5">•</span>
                  <span>{warning}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {recommendations.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Recommendations:</h4>
            <div className="space-y-2">
              {recommendations.map((recommendation, index) => (
                <div key={index} className="text-sm p-3 bg-muted rounded-lg">
                  {recommendation}
                </div>
              ))}
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open('https://www.google.com/chrome/', '_blank')}
                className="flex items-center gap-1"
              >
                <Download className="h-3 w-3" />
                Chrome
                <ExternalLink className="h-3 w-3" />
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open('https://www.mozilla.org/firefox/', '_blank')}
                className="flex items-center gap-1"
              >
                <Download className="h-3 w-3" />
                Firefox
                <ExternalLink className="h-3 w-3" />
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open('https://www.microsoft.com/edge', '_blank')}
                className="flex items-center gap-1"
              >
                <Download className="h-3 w-3" />
                Edge
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}

        {!isSupported && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">Critical Features Unavailable</p>
                <p className="text-sm">
                  The platform may not function correctly. Please update your browser 
                  or switch to a supported browser for the best experience.
                </p>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

export function BrowserCompatibilityBadge() {
  const { isSupported, browser, version, warnings } = useBrowserCompatibility();

  const getStatusColor = () => {
    if (!isSupported) return 'destructive';
    if (warnings.length > 0) return 'secondary';
    return 'default';
  };

  const getStatusText = () => {
    if (!isSupported) return 'Unsupported';
    if (warnings.length > 0) return 'Limited Support';
    return 'Fully Supported';
  };

  return (
    <div className="flex items-center gap-2 text-xs">
      <Monitor className="h-3 w-3" />
      <span>{browser} {version}</span>
      <Badge variant={getStatusColor()} className="text-xs">
        {getStatusText()}
      </Badge>
    </div>
  );
}