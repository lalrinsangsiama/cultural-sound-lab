import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 1,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<1000'],
    http_req_failed: ['rate<0.1'],
  },
};

const BASE_URL = 'http://api:3001';

export default function () {
  // Health check
  let response = http.get(`${BASE_URL}/api/health`);
  check(response, {
    'Health check status is 200': (r) => r.status === 200,
    'Health check response time < 100ms': (r) => r.timings.duration < 100,
  });

  // Audio samples endpoint
  response = http.get(`${BASE_URL}/api/audio/samples`);
  check(response, {
    'Audio samples status is 200': (r) => r.status === 200,
    'Audio samples response time < 500ms': (r) => r.timings.duration < 500,
  });

  // Test authentication
  response = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
    email: 'john.doe@example.com',
    password: 'password123'
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
  
  check(response, {
    'Login attempt processed': (r) => [200, 401].includes(r.status),
    'Login response time < 300ms': (r) => r.timings.duration < 300,
  });

  sleep(1);
}