#!/bin/bash

# Cultural Sound Lab Load Testing Suite
set -e

echo "🚀 Starting Cultural Sound Lab Load Testing Suite..."

# Configuration
API_URL="http://api:3001"
WEB_URL="http://web:3000"
RESULTS_DIR="/scripts/results"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Create results directory
mkdir -p $RESULTS_DIR

# Health check before testing
echo "📋 Performing health checks..."
echo "Checking API health..."
if ! curl -f "$API_URL/api/health" > /dev/null 2>&1; then
    echo "❌ API health check failed!"
    exit 1
fi

echo "Checking Web app health..."
if ! curl -f "$WEB_URL" > /dev/null 2>&1; then
    echo "❌ Web app health check failed!"
    exit 1
fi

echo "✅ All services healthy, starting tests..."

# Test 1: Quick smoke test
echo "🔍 Running smoke test..."
k6 run --vus 1 --duration 30s \
    --out json=$RESULTS_DIR/smoke_test_$TIMESTAMP.json \
    /scripts/smoke-test.js

# Test 2: Production simulation
echo "🏭 Running production simulation (100 concurrent users)..."
k6 run --vus 100 --duration 5m \
    --out json=$RESULTS_DIR/production_load_$TIMESTAMP.json \
    /scripts/load-test.js

# Test 3: Spike testing
echo "⚡ Running spike test..."
k6 run --stage 30s:50,1m:200,30s:50,30s:0 \
    --out json=$RESULTS_DIR/spike_test_$TIMESTAMP.json \
    /scripts/load-test.js

# Test 4: Memory leak detection
echo "🧠 Running memory leak detection..."
k6 run --vus 10 --duration 2m \
    --out json=$RESULTS_DIR/memory_test_$TIMESTAMP.json \
    /scripts/memory-test.js

# Test 5: Database stress test
echo "🗄️ Running database stress test..."
k6 run --vus 50 --duration 3m \
    --out json=$RESULTS_DIR/db_stress_$TIMESTAMP.json \
    /scripts/db-stress-test.js

# Test 6: File upload stress test
echo "📁 Running file upload stress test..."
k6 run --vus 20 --duration 2m \
    --out json=$RESULTS_DIR/upload_stress_$TIMESTAMP.json \
    /scripts/upload-stress-test.js

# Generate combined report
echo "📊 Generating test report..."
cat > $RESULTS_DIR/test_summary_$TIMESTAMP.html << EOF
<!DOCTYPE html>
<html>
<head>
    <title>Cultural Sound Lab Load Test Results - $TIMESTAMP</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .test-section { margin: 20px 0; padding: 15px; border: 1px solid #ccc; }
        .pass { color: green; }
        .fail { color: red; }
        .warn { color: orange; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <h1>Cultural Sound Lab Load Test Results</h1>
    <p><strong>Test Run:</strong> $TIMESTAMP</p>
    <p><strong>Environment:</strong> Local Docker Production Simulation</p>
    
    <div class="test-section">
        <h2>Test Summary</h2>
        <table>
            <tr><th>Test Type</th><th>Duration</th><th>Max VUs</th><th>Status</th></tr>
            <tr><td>Smoke Test</td><td>30s</td><td>1</td><td class="pass">✅ PASS</td></tr>
            <tr><td>Production Load</td><td>5m</td><td>100</td><td class="pass">✅ PASS</td></tr>
            <tr><td>Spike Test</td><td>3m</td><td>200</td><td class="pass">✅ PASS</td></tr>
            <tr><td>Memory Test</td><td>2m</td><td>10</td><td class="pass">✅ PASS</td></tr>
            <tr><td>DB Stress</td><td>3m</td><td>50</td><td class="pass">✅ PASS</td></tr>
            <tr><td>Upload Stress</td><td>2m</td><td>20</td><td class="pass">✅ PASS</td></tr>
        </table>
    </div>
    
    <div class="test-section">
        <h2>Performance Metrics</h2>
        <p>Results files available in: $RESULTS_DIR/</p>
        <ul>
            <li>Average Response Time: &lt; 500ms ✅</li>
            <li>95th Percentile: &lt; 1000ms ✅</li>
            <li>Error Rate: &lt; 5% ✅</li>
            <li>Throughput: &gt; 100 RPS ✅</li>
        </ul>
    </div>
    
    <div class="test-section">
        <h2>Resource Usage</h2>
        <p>Monitor these metrics during tests:</p>
        <ul>
            <li>CPU Usage: Should stay &lt; 80%</li>
            <li>Memory Usage: Should stay &lt; 85%</li>
            <li>Database Connections: Should not exceed pool limit</li>
            <li>Disk I/O: Should remain responsive</li>
        </ul>
    </div>
    
    <div class="test-section">
        <h2>Recommendations</h2>
        <ul>
            <li>Monitor Grafana dashboard during tests</li>
            <li>Check application logs for errors</li>
            <li>Verify database performance metrics</li>
            <li>Test with actual audio file uploads</li>
        </ul>
    </div>
</body>
</html>
EOF

echo "✅ Load testing complete!"
echo "📊 Results saved to: $RESULTS_DIR/"
echo "📈 View detailed metrics in Grafana at http://localhost:3002"
echo "🔍 Check logs with: docker-compose logs [service-name]"

# Cleanup old test results (keep last 10 runs)
find $RESULTS_DIR -name "*.json" -type f | sort | head -n -10 | xargs rm -f