import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Basic health checks
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'cultural-sound-lab-web',
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      checks: {
        server: 'healthy',
        memory: checkMemoryUsage(),
        disk: 'healthy' // Simplified for demo
      }
    };

    return NextResponse.json(health);
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 503 }
    );
  }
}

function checkMemoryUsage() {
  const used = process.memoryUsage();
  const totalMB = Math.round(used.rss / 1024 / 1024);
  const heapUsedMB = Math.round(used.heapUsed / 1024 / 1024);
  const heapTotalMB = Math.round(used.heapTotal / 1024 / 1024);
  
  return {
    status: totalMB < 512 ? 'healthy' : 'warning',
    rss: `${totalMB}MB`,
    heapUsed: `${heapUsedMB}MB`,
    heapTotal: `${heapTotalMB}MB`
  };
}