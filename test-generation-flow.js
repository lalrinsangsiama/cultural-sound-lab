#!/usr/bin/env node

// Test script for the complete mock generation flow
// This simulates the frontend calling the API

const API_BASE_URL = 'http://localhost:3001';

async function testGenerationFlow() {
  console.log('🎵 Testing Cultural Sound Lab Mock Generation Flow\n');

  // Mock generation request
  const generationRequest = {
    type: 'sound_logo',
    parameters: {
      duration: 10,
      mood: 'energetic',
      brand_name: 'Cultural Sound Lab',
      tempo: 120,
      energy_level: 0.8,
      cultural_style: 'mizo'
    },
    source_samples: ['sample-1', 'sample-2'] // Mock sample IDs
  };

  try {
    console.log('1. 🚀 Creating generation request...');
    console.log('   Request:', JSON.stringify(generationRequest, null, 2));
    
    // In mock mode, authentication is bypassed with a demo user
    
    const response = await fetch(`${API_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(generationRequest)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const generationData = await response.json();
    console.log('   ✅ Generation created:', {
      id: generationData.id,
      job_id: generationData.job_id,
      estimated_time: generationData.estimated_completion_time + 's'
    });

    // Simulate polling for status
    console.log('\n2. 📊 Polling job status...');
    let completed = false;
    let attempts = 0;
    const maxAttempts = 30; // 1 minute max

    while (!completed && attempts < maxAttempts) {
      attempts++;
      
      const statusResponse = await fetch(`${API_BASE_URL}/api/generate/job/${generationData.job_id}/status`);
      
      if (!statusResponse.ok) {
        console.log(`   ⚠️  Status check failed: ${statusResponse.status}`);
        break;
      }

      const status = await statusResponse.json();
      console.log(`   📈 Progress: ${status.progress || 0}% (${status.status})`);

      if (status.status === 'completed') {
        console.log('   🎉 Generation completed!');
        console.log('   📁 Result URL:', status.result_url);
        completed = true;
      } else if (status.status === 'failed') {
        console.log('   ❌ Generation failed:', status.error_message);
        break;
      }

      if (!completed) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      }
    }

    if (!completed) {
      console.log('   ⏰ Polling timeout reached');
    }

    console.log('\n3. 📥 Testing demo audio download...');
    
    // Test demo audio endpoint
    const demoResponse = await fetch(`${API_BASE_URL}/api/demo-audio/sound-logo-demo.mp3`);
    
    if (demoResponse.ok) {
      console.log('   ✅ Demo audio accessible');
      console.log('   📊 Content-Type:', demoResponse.headers.get('content-type'));
      console.log('   📏 Content-Length:', demoResponse.headers.get('content-length') || 'unknown');
    } else {
      console.log('   ❌ Demo audio not accessible:', demoResponse.status);
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Make sure the API server is running:');
      console.log('   cd apps/api && npm run dev');
    }
  }

  console.log('\n🏁 Test completed');
}

// Handle uncaught errors
process.on('unhandledRejection', (error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});

// Run the test
testGenerationFlow();