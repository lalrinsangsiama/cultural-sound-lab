import { HealthCheckDashboard } from '@/components/health-check-dashboard';

export default function HealthPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col items-center justify-center min-h-[80vh]">
        <h1 className="text-3xl font-bold mb-8">System Health Status</h1>
        <HealthCheckDashboard />
      </div>
    </div>
  );
}