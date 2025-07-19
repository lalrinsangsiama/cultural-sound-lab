'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, XCircle, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createBrowserClient } from '@supabase/ssr';

interface HealthStatus {
  frontend: boolean | null;
  api: boolean | null;
  database: boolean | null;
  storage: boolean | null;
  loading: boolean;
  lastChecked: Date | null;
  error?: string;
}

interface APIHealthResponse {
  status: string;
  database: boolean;
  redis: boolean;
  timestamp: string;
}

export function HealthCheckDashboard() {
  const [health, setHealth] = useState<HealthStatus>({
    frontend: null,
    api: null,
    database: null,
    storage: null,
    loading: true,
    lastChecked: null,
  });

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const checkHealth = async () => {
    console.log('🏥 Starting health checks...');
    setHealth(prev => ({ ...prev, loading: true, error: undefined }));

    const newHealth: HealthStatus = {
      frontend: false,
      api: false,
      database: false,
      storage: false,
      loading: false,
      lastChecked: new Date(),
    };

    try {
      // 1. Frontend check (always true if this component is rendering)
      newHealth.frontend = true;
      console.log('✅ Frontend: Connected');

      // 2. API health check
      try {
        const apiResponse = await fetch('/api/health', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (apiResponse.ok) {
          const apiData: APIHealthResponse = await apiResponse.json();
          newHealth.api = apiData.status === 'ok';
          newHealth.database = apiData.database;
          console.log('✅ API: Connected', apiData);
        } else {
          console.error('❌ API: Failed with status', apiResponse.status);
        }
      } catch (apiError) {
        console.error('❌ API: Connection failed', apiError);
        newHealth.api = false;
      }

      // 3. Direct database check via Supabase
      try {
        const { data, error } = await supabase
          .from('audio_samples')
          .select('id')
          .limit(1);

        if (!error && data) {
          newHealth.database = true;
          console.log('✅ Database: Connected (direct check)');
        } else {
          console.error('❌ Database: Direct check failed', error);
        }
      } catch (dbError) {
        console.error('❌ Database: Connection failed', dbError);
      }

      // 4. Storage check
      try {
        // Check if we can access the storage bucket list
        const { data: buckets, error } = await supabase.storage.listBuckets();
        
        if (!error && buckets) {
          newHealth.storage = true;
          console.log('✅ Storage: Connected', { bucketCount: buckets.length });
        } else {
          console.error('❌ Storage: Failed to list buckets', error);
        }
      } catch (storageError) {
        console.error('❌ Storage: Connection failed', storageError);
        newHealth.storage = false;
      }

    } catch (error) {
      console.error('❌ Health check error:', error);
      newHealth.error = error instanceof Error ? error.message : 'Unknown error';
    }

    setHealth(newHealth);
    console.log('🏥 Health check complete:', newHealth);
  };

  useEffect(() => {
    checkHealth();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(checkHealth, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: boolean | null) => {
    if (status === null) {
      return <Loader2 className="h-5 w-5 animate-spin text-gray-400" />;
    }
    return status ? (
      <CheckCircle2 className="h-5 w-5 text-green-500" />
    ) : (
      <XCircle className="h-5 w-5 text-red-500" />
    );
  };

  const getStatusText = (status: boolean | null) => {
    if (status === null) return 'Checking...';
    return status ? 'Connected' : 'Disconnected';
  };

  const services = [
    { name: 'Frontend', key: 'frontend' as keyof HealthStatus, description: 'Next.js application' },
    { name: 'API', key: 'api' as keyof HealthStatus, description: 'Express.js backend' },
    { name: 'Database', key: 'database' as keyof HealthStatus, description: 'Supabase PostgreSQL' },
    { name: 'Storage', key: 'storage' as keyof HealthStatus, description: 'Supabase Storage' },
  ];

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>System Health Check</CardTitle>
            <CardDescription>
              Real-time status of all services
              {health.lastChecked && (
                <span className="ml-2 text-xs">
                  Last checked: {health.lastChecked.toLocaleTimeString()}
                </span>
              )}
            </CardDescription>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={checkHealth}
            disabled={health.loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${health.loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {services.map((service) => {
            const status = health[service.key] as boolean | null;
            return (
              <div
                key={service.name}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  {getStatusIcon(status)}
                  <div>
                    <p className="font-medium">{service.name}</p>
                    <p className="text-sm text-muted-foreground">{service.description}</p>
                  </div>
                </div>
                <span className={`text-sm font-medium ${
                  status === true ? 'text-green-600' : 
                  status === false ? 'text-red-600' : 
                  'text-gray-500'
                }`}>
                  {getStatusText(status)}
                </span>
              </div>
            );
          })}
        </div>
        
        {health.error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">Error: {health.error}</p>
          </div>
        )}
        
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600 font-mono">
            Check the browser console for detailed connection logs
          </p>
        </div>
      </CardContent>
    </Card>
  );
}