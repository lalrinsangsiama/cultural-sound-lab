import { createClient } from '@supabase/supabase-js';
import axios, { AxiosInstance } from 'axios';
import { Database } from '../src/types/database';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const API_URL = process.env.API_URL || 'http://localhost:3001';
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY!;

// Test configuration
const testConfig = {
  adminEmail: 'admin@culturalsoundlab.com',
  adminPassword: 'admin123456',
  userEmail: 'user@culturalsoundlab.com',
  userPassword: 'user123456',
  contributorEmail: 'contributor@culturalsoundlab.com',
  contributorPassword: 'contributor123456'
};

// Create Supabase client
const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Test results
interface TestResult {
  test: string;
  status: 'passed' | 'failed';
  message?: string;
  duration?: number;
}

const testResults: TestResult[] = [];

// Helper function to log test results
function logTest(test: string, passed: boolean, message?: string, duration?: number) {
  const status = passed ? 'passed' : 'failed';
  const emoji = passed ? '✅' : '❌';
  console.log(`${emoji} ${test}: ${status}${message ? ` - ${message}` : ''}`);
  testResults.push({ test, status, message, duration });
}

// Test 1: User Registration
async function testUserRegistration() {
  const startTime = Date.now();
  console.log('\n🧪 Testing User Registration...');
  
  try {
    // Test registration with new user
    const newUser = {
      email: 'testuser@example.com',
      password: 'testpassword123',
      name: 'Test User'
    };
    
    const { data, error } = await supabase.auth.signUp({
      email: newUser.email,
      password: newUser.password,
      options: {
        data: {
          name: newUser.name
        }
      }
    });
    
    if (error) throw error;
    
    logTest('User Registration', true, 'New user created successfully', Date.now() - startTime);
    
    // Clean up - delete test user
    if (data.user) {
      await supabase.auth.admin.deleteUser(data.user.id);
    }
  } catch (error: any) {
    logTest('User Registration', false, error.message, Date.now() - startTime);
  }
}

// Test 2: User Login
async function testUserLogin() {
  const startTime = Date.now();
  console.log('\n🧪 Testing User Login...');
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: testConfig.userEmail,
      password: testConfig.userPassword
    });
    
    if (error) throw error;
    
    // Store the session token for API tests
    if (data.session) {
      api.defaults.headers.common['Authorization'] = `Bearer ${data.session.access_token}`;
    }
    
    logTest('User Login', true, 'Login successful', Date.now() - startTime);
    return data.session;
  } catch (error: any) {
    logTest('User Login', false, error.message, Date.now() - startTime);
    return null;
  }
}

// Test 3: Load Audio Samples
async function testLoadAudioSamples() {
  const startTime = Date.now();
  console.log('\n🧪 Testing Audio Samples Loading...');
  
  try {
    const response = await api.get('/api/audio/samples');
    
    if (response.status !== 200) {
      throw new Error(`API returned status ${response.status}`);
    }
    
    const samples = response.data;
    
    if (!Array.isArray(samples)) {
      throw new Error('Response is not an array');
    }
    
    if (samples.length === 0) {
      throw new Error('No audio samples found');
    }
    
    // Verify sample structure
    const requiredFields = ['id', 'title', 'description', 'cultural_origin', 'instrument_type'];
    const firstSample = samples[0];
    const missingFields = requiredFields.filter(field => !(field in firstSample));
    
    if (missingFields.length > 0) {
      throw new Error(`Missing fields in sample: ${missingFields.join(', ')}`);
    }
    
    logTest('Load Audio Samples', true, `Loaded ${samples.length} samples`, Date.now() - startTime);
    console.log(`  📀 Sample titles: ${samples.map((s: any) => s.title).join(', ')}`);
    
    return samples;
  } catch (error: any) {
    logTest('Load Audio Samples', false, error.message, Date.now() - startTime);
    return [];
  }
}

// Test 4: Test Generation Form Submission
async function testGenerationSubmission(sampleId?: string) {
  const startTime = Date.now();
  console.log('\n🧪 Testing Generation Form Submission...');
  
  try {
    // If no sample ID provided, get one from the API
    if (!sampleId) {
      const samples = await api.get('/api/audio/samples');
      if (samples.data && samples.data.length > 0) {
        sampleId = samples.data[0].id;
      } else {
        throw new Error('No audio samples available for generation');
      }
    }
    
    const generationRequest = {
      sourceId: sampleId,
      type: 'sound_logo',
      parameters: {
        duration: 10,
        mood: 'energetic',
        style: 'modern'
      }
    };
    
    const response = await api.post('/api/generate/sound-logo', generationRequest);
    
    if (response.status !== 200 && response.status !== 201) {
      throw new Error(`API returned status ${response.status}`);
    }
    
    const generation = response.data;
    
    if (!generation.id || !generation.status) {
      throw new Error('Invalid generation response structure');
    }
    
    logTest('Generation Submission', true, `Generation ID: ${generation.id}`, Date.now() - startTime);
    console.log(`  🤖 Status: ${generation.status}`);
    
    return generation;
  } catch (error: any) {
    logTest('Generation Submission', false, error.response?.data?.error || error.message, Date.now() - startTime);
    return null;
  }
}

// Test 5: API Health Check
async function testAPIHealth() {
  const startTime = Date.now();
  console.log('\n🧪 Testing API Health Check...');
  
  try {
    const response = await api.get('/health');
    
    if (response.status !== 200) {
      throw new Error(`Health check returned status ${response.status}`);
    }
    
    const health = response.data;
    
    logTest('API Health Check', true, `Status: ${health.status}`, Date.now() - startTime);
    console.log(`  🏥 Database: ${health.database ? 'Connected' : 'Disconnected'}`);
    console.log(`  🏥 Redis: ${health.redis ? 'Connected' : 'Disconnected'}`);
    
    return health;
  } catch (error: any) {
    logTest('API Health Check', false, error.message, Date.now() - startTime);
    return null;
  }
}

// Test 6: Test Protected Route Access
async function testProtectedRoute() {
  const startTime = Date.now();
  console.log('\n🧪 Testing Protected Route Access...');
  
  try {
    // First, try without authentication
    const tempHeaders = { ...api.defaults.headers.common };
    delete api.defaults.headers.common['Authorization'];
    
    try {
      await api.get('/api/generate/my-generations');
      throw new Error('Protected route accessible without authentication');
    } catch (error: any) {
      if (error.response?.status !== 401) {
        throw error;
      }
    }
    
    // Restore headers and try with authentication
    api.defaults.headers.common = tempHeaders;
    const response = await api.get('/api/generate/my-generations');
    
    if (response.status !== 200) {
      throw new Error(`Protected route returned status ${response.status}`);
    }
    
    logTest('Protected Route Access', true, 'Authentication working correctly', Date.now() - startTime);
  } catch (error: any) {
    logTest('Protected Route Access', false, error.message, Date.now() - startTime);
  }
}

// Test 7: License Creation
async function testLicenseCreation(sampleId?: string) {
  const startTime = Date.now();
  console.log('\n🧪 Testing License Creation...');
  
  try {
    // If no sample ID provided, get one from the API
    if (!sampleId) {
      const samples = await api.get('/api/audio/samples');
      if (samples.data && samples.data.length > 0) {
        sampleId = samples.data[0].id;
      } else {
        throw new Error('No audio samples available for licensing');
      }
    }
    
    const licenseRequest = {
      audioSampleId: sampleId,
      licenseType: 'commercial',
      usageDetails: {
        company: 'Integration Test Company',
        project: 'Test Project',
        duration: '1 year'
      }
    };
    
    const response = await api.post('/api/license/create', licenseRequest);
    
    if (response.status !== 200 && response.status !== 201) {
      throw new Error(`API returned status ${response.status}`);
    }
    
    const license = response.data;
    
    if (!license.id || !license.licenseType) {
      throw new Error('Invalid license response structure');
    }
    
    logTest('License Creation', true, `License ID: ${license.id}`, Date.now() - startTime);
    console.log(`  📜 Type: ${license.licenseType}`);
    console.log(`  💰 Price: $${license.price}`);
    
    return license;
  } catch (error: any) {
    logTest('License Creation', false, error.response?.data?.error || error.message, Date.now() - startTime);
    return null;
  }
}

// Main test runner
async function runIntegrationTests() {
  console.log('🚀 Starting Cultural Sound Lab Integration Tests');
  console.log('=' .repeat(50));
  
  try {
    // Run tests in sequence
    await testUserRegistration();
    const session = await testUserLogin();
    
    if (session) {
      await testAPIHealth();
      const samples = await testLoadAudioSamples();
      
      if (samples.length > 0) {
        await testGenerationSubmission(samples[0].id);
        await testLicenseCreation(samples[0].id);
      }
      
      await testProtectedRoute();
    }
    
    // Summary
    console.log('\n' + '=' .repeat(50));
    console.log('📊 Test Summary:');
    console.log('=' .repeat(50));
    
    const passed = testResults.filter(r => r.status === 'passed').length;
    const failed = testResults.filter(r => r.status === 'failed').length;
    const totalDuration = testResults.reduce((sum, r) => sum + (r.duration || 0), 0);
    
    console.log(`Total Tests: ${testResults.length}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⏱️  Total Duration: ${totalDuration}ms`);
    
    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      testResults
        .filter(r => r.status === 'failed')
        .forEach(r => console.log(`  - ${r.test}: ${r.message}`));
    }
    
    // Exit with appropriate code
    process.exit(failed > 0 ? 1 : 0);
    
  } catch (error) {
    console.error('❌ Fatal error during test execution:', error);
    process.exit(1);
  }
}

// Run tests
runIntegrationTests();