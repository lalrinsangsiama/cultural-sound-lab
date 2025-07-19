import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const responseTrend = new Trend('response_time');
const requestCounter = new Counter('requests_total');

// Load test configuration
export const options = {
  scenarios: {
    // Production simulation: 100 concurrent users
    production_load: {
      executor: 'constant-vus',
      vus: 100,
      duration: '10m',
    },
    
    // Spike test: sudden traffic increase
    spike_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 50 },   // Ramp up
        { duration: '1m', target: 200 },  // Spike
        { duration: '2m', target: 50 },   // Scale down
        { duration: '2m', target: 0 },    // Ramp down
      ],
      startTime: '11m', // Start after production load
    },
    
    // Stress test: find breaking point
    stress_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '5m', target: 100 },
        { duration: '5m', target: 200 },
        { duration: '5m', target: 300 },
        { duration: '5m', target: 400 },
        { duration: '10m', target: 400 },
        { duration: '5m', target: 0 },
      ],
      startTime: '16m', // Start after spike test
    }
  },
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    http_req_failed: ['rate<0.05'],   // Less than 5% error rate
    errors: ['rate<0.05'],
    requests_total: ['count>10000'],  // Minimum request volume
  },
};

const BASE_URL = 'http://api:3001';

// Test data
const testUsers = [
  { email: 'john.doe@example.com', password: 'password123' },
  { email: 'sarah.chen@example.com', password: 'password123' },
  { email: 'miguel.rodriguez@example.com', password: 'password123' },
  { email: 'priya.patel@example.com', password: 'password123' },
  { email: 'ahmed.hassan@example.com', password: 'password123' },
];

const generationTypes = ['sound-logo', 'social-clip', 'playlist', 'long-form'];
const sampleIds = [
  '660e8400-e29b-41d4-a716-446655440001',
  '660e8400-e29b-41d4-a716-446655440004',
  '660e8400-e29b-41d4-a716-446655440007',
  '660e8400-e29b-41d4-a716-446655440009',
  '660e8400-e29b-41d4-a716-446655440011',
];

// Authentication helper
function authenticate() {
  const user = testUsers[Math.floor(Math.random() * testUsers.length)];
  const loginResponse = http.post(`${BASE_URL}/api/auth/login`, {
    email: user.email,
    password: user.password,
  }, {
    headers: { 'Content-Type': 'application/json' },
  });
  
  if (loginResponse.status === 200) {
    const token = loginResponse.json('token');
    return { 'Authorization': `Bearer ${token}` };
  }
  return null;
}

// Test scenarios
export default function () {
  requestCounter.add(1);
  
  const authHeaders = authenticate();
  if (!authHeaders) {
    errorRate.add(1);
    return;
  }

  // Weighted test scenarios (realistic user behavior)
  const scenario = Math.random();
  
  if (scenario < 0.4) {
    // 40% - Browse audio library
    testAudioLibrary(authHeaders);
  } else if (scenario < 0.7) {
    // 30% - Generate audio content
    testAudioGeneration(authHeaders);
  } else if (scenario < 0.85) {
    // 15% - View dashboard/analytics
    testDashboard(authHeaders);
  } else if (scenario < 0.95) {
    // 10% - License management
    testLicensing(authHeaders);
  } else {
    // 5% - Administrative tasks
    testAdmin(authHeaders);
  }
  
  sleep(Math.random() * 3 + 1); // Random think time 1-4 seconds
}

function testAudioLibrary(headers) {
  // Get audio samples list
  let response = http.get(`${BASE_URL}/api/audio/samples`, { headers });
  check(response, {
    'Audio samples list loaded': (r) => r.status === 200,
    'Response time < 500ms': (r) => r.timings.duration < 500,
  });
  responseTrend.add(response.timings.duration);
  
  if (response.status !== 200) {
    errorRate.add(1);
    return;
  }

  // Get sample metadata
  const sampleId = sampleIds[Math.floor(Math.random() * sampleIds.length)];
  response = http.get(`${BASE_URL}/api/audio/samples/${sampleId}`, { headers });
  check(response, {
    'Sample metadata loaded': (r) => r.status === 200,
  });
  
  // Track playback analytics
  http.post(`${BASE_URL}/api/analytics/track`, {
    event_type: 'sample_played',
    entity_id: sampleId,
    properties: { duration: 30, completion_rate: 0.8 }
  }, { headers });
}

function testAudioGeneration(headers) {
  const generationType = generationTypes[Math.floor(Math.random() * generationTypes.length)];
  const sourceSampleId = sampleIds[Math.floor(Math.random() * sampleIds.length)];
  
  const generationPayload = {
    type: generationType,
    source_sample_ids: [sourceSampleId],
    duration: generationType === 'sound-logo' ? 15 : 
              generationType === 'social-clip' ? 30 :
              generationType === 'playlist' ? 300 : 600,
    mood: ['peaceful', 'energetic', 'mystical'][Math.floor(Math.random() * 3)],
    energy_level: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
  };

  // Start generation
  let response = http.post(`${BASE_URL}/api/generate/${generationType}`, 
    JSON.stringify(generationPayload), 
    { 
      headers: { 
        ...headers, 
        'Content-Type': 'application/json' 
      } 
    }
  );
  
  check(response, {
    'Generation started': (r) => r.status === 202,
    'Generation response time acceptable': (r) => r.timings.duration < 1000,
  });
  
  if (response.status !== 202) {
    errorRate.add(1);
    return;
  }

  const generationId = response.json('generation_id');
  
  // Poll generation status (simulate user checking progress)
  for (let i = 0; i < 3; i++) {
    sleep(2);
    response = http.get(`${BASE_URL}/api/generate/status/${generationId}`, { headers });
    check(response, {
      'Generation status check': (r) => r.status === 200,
    });
    
    if (response.json('status') === 'completed') {
      break;
    }
  }
}

function testDashboard(headers) {
  // Get user dashboard data
  let response = http.get(`${BASE_URL}/api/dashboard/overview`, { headers });
  check(response, {
    'Dashboard loaded': (r) => r.status === 200,
  });
  
  // Get earnings data
  response = http.get(`${BASE_URL}/api/analytics/earnings`, { headers });
  check(response, {
    'Earnings data loaded': (r) => r.status === 200,
  });
  
  // Get generation history
  response = http.get(`${BASE_URL}/api/generate/history`, { headers });
  check(response, {
    'Generation history loaded': (r) => r.status === 200,
  });
}

function testLicensing(headers) {
  // Get user licenses
  let response = http.get(`${BASE_URL}/api/license/my-licenses`, { headers });
  check(response, {
    'Licenses loaded': (r) => r.status === 200,
  });
  
  // Simulate license purchase flow
  const licensePayload = {
    generation_id: '770e8400-e29b-41d4-a716-446655440001',
    license_type: 'commercial',
    usage_rights: 'Commercial use with attribution',
  };
  
  response = http.post(`${BASE_URL}/api/license/create`, 
    JSON.stringify(licensePayload), 
    { 
      headers: { 
        ...headers, 
        'Content-Type': 'application/json' 
      } 
    }
  );
  
  check(response, {
    'License creation attempted': (r) => [200, 201, 400].includes(r.status),
  });
}

function testAdmin(headers) {
  // Health check
  let response = http.get(`${BASE_URL}/api/health`, { headers });
  check(response, {
    'Health check passed': (r) => r.status === 200,
  });
  
  // System metrics (if admin user)
  response = http.get(`${BASE_URL}/api/admin/metrics`, { headers });
  check(response, {
    'Metrics accessible': (r) => [200, 403].includes(r.status),
  });
}

// Performance test specific scenarios
export function performanceTest() {
  const headers = authenticate();
  if (!headers) return;
  
  // High-frequency endpoint testing
  const endpoints = [
    '/api/health',
    '/api/audio/samples',
    '/api/dashboard/overview',
  ];
  
  endpoints.forEach(endpoint => {
    const response = http.get(`${BASE_URL}${endpoint}`, { headers });
    check(response, {
      [`${endpoint} performance`]: (r) => r.timings.duration < 200,
    });
  });
}

// Memory leak detection
export function memoryTest() {
  const headers = authenticate();
  if (!headers) return;
  
  // Simulate memory-intensive operations
  for (let i = 0; i < 50; i++) {
    http.get(`${BASE_URL}/api/audio/samples`, { headers });
    
    // Large payload generation
    const largePayload = {
      type: 'long-form',
      source_sample_ids: sampleIds,
      duration: 3600,
      style_parameters: {
        layers: Array(20).fill(0).map((_, idx) => ({ id: idx, weight: Math.random() })),
        effects: Array(10).fill(0).map((_, idx) => ({ type: `effect_${idx}`, intensity: Math.random() })),
      }
    };
    
    http.post(`${BASE_URL}/api/generate/long-form`, 
      JSON.stringify(largePayload), 
      { 
        headers: { 
          ...headers, 
          'Content-Type': 'application/json' 
        } 
      }
    );
    
    if (i % 10 === 0) {
      sleep(1); // Brief pause to allow garbage collection
    }
  }
}

// Database connection stress test
export function dbStressTest() {
  const headers = authenticate();
  if (!headers) return;
  
  // Concurrent database operations
  const promises = [];
  for (let i = 0; i < 20; i++) {
    promises.push(
      http.asyncRequest('GET', `${BASE_URL}/api/analytics/events`, null, { headers })
    );
  }
  
  // Analytics insertion stress
  for (let i = 0; i < 100; i++) {
    http.post(`${BASE_URL}/api/analytics/track`, {
      event_type: 'stress_test_event',
      properties: { 
        test_id: i, 
        timestamp: new Date().toISOString(),
        data: Array(100).fill(0).map(() => Math.random())
      }
    }, { headers });
  }
}