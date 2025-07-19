import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const metrics = generatePrometheusMetrics();
    
    return new Response(metrics, {
      headers: {
        'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
        'Cache-Control': 'no-cache'
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate metrics' },
      { status: 500 }
    );
  }
}

function generatePrometheusMetrics(): string {
  const now = Date.now();
  const memUsage = process.memoryUsage();
  const uptime = process.uptime();
  
  return `
# HELP csl_web_uptime_seconds Application uptime in seconds
# TYPE csl_web_uptime_seconds counter
csl_web_uptime_seconds ${uptime}

# HELP csl_web_memory_usage_bytes Memory usage in bytes
# TYPE csl_web_memory_usage_bytes gauge
csl_web_memory_usage_bytes{type="rss"} ${memUsage.rss}
csl_web_memory_usage_bytes{type="heap_used"} ${memUsage.heapUsed}
csl_web_memory_usage_bytes{type="heap_total"} ${memUsage.heapTotal}
csl_web_memory_usage_bytes{type="external"} ${memUsage.external}

# HELP csl_web_nodejs_version_info Node.js version information
# TYPE csl_web_nodejs_version_info gauge
csl_web_nodejs_version_info{version="${process.version}"} 1

# HELP csl_web_build_info Build information
# TYPE csl_web_build_info gauge
csl_web_build_info{version="${process.env.npm_package_version || '1.0.0'}",environment="${process.env.NODE_ENV || 'development'}"} 1

# HELP csl_web_health_status Application health status (1 = healthy, 0 = unhealthy)
# TYPE csl_web_health_status gauge
csl_web_health_status 1
`.trim();
}