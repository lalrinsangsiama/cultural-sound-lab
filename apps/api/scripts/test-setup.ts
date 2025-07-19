import { createClient } from '@supabase/supabase-js';
import { Database } from '../src/types/database';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as bcrypt from 'bcrypt';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Create admin client that bypasses RLS
const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Mock audio file URLs (using placeholder URLs for now)
const mockAudioFiles = {
  mizoFlute: 'https://storage.supabase.co/v1/object/public/audio-samples/mizo-flute-sample.mp3',
  mizoGong: 'https://storage.supabase.co/v1/object/public/audio-samples/mizo-gong-sample.mp3',
  mizoDrum: 'https://storage.supabase.co/v1/object/public/audio-samples/mizo-drum-sample.mp3'
};

// Sample data for Mizo instruments
const mizoSamples = [
  {
    title: 'Traditional Mizo Flute',
    description: 'A haunting melody played on the traditional bamboo flute of the Mizo people',
    file_url: mockAudioFiles.mizoFlute,
    duration: 45,
    bpm: 80,
    key_signature: 'C Major',
    instrument_type: 'Wind',
    cultural_origin: 'Mizo',
    cultural_context: 'The bamboo flute, known as "Thlumte" in Mizo, is traditionally used in folk songs and harvest celebrations. Its melodic patterns reflect the rolling hills and misty landscapes of Mizoram.',
    mood_tags: ['peaceful', 'nostalgic', 'ceremonial'],
    usage_rights: 'commercial',
    price_personal: 5.00,
    price_commercial: 50.00,
    price_enterprise: 200.00,
    preview_url: mockAudioFiles.mizoFlute,
    waveform_data: Array(100).fill(0).map(() => Math.random() * 0.8 + 0.1),
    uploaded_by: null as string | null, // Will be set after creating users
    is_active: true
  },
  {
    title: 'Mizo Ceremonial Gong',
    description: 'Deep resonant tones from a traditional Mizo gong used in important ceremonies',
    file_url: mockAudioFiles.mizoGong,
    duration: 30,
    bpm: 60,
    key_signature: 'A Minor',
    instrument_type: 'Percussion',
    cultural_origin: 'Mizo',
    cultural_context: 'The "Darkhuang" is a traditional brass gong that plays a central role in Mizo cultural ceremonies. Its deep, resonant sound is believed to connect the physical and spiritual worlds.',
    mood_tags: ['powerful', 'ceremonial', 'spiritual'],
    usage_rights: 'commercial',
    price_personal: 10.00,
    price_commercial: 75.00,
    price_enterprise: 300.00,
    preview_url: mockAudioFiles.mizoGong,
    waveform_data: Array(100).fill(0).map(() => Math.random() * 0.9 + 0.05),
    uploaded_by: null as string | null,
    is_active: true
  },
  {
    title: 'Mizo Festival Drums',
    description: 'Energetic drumming patterns from the Chapchar Kut harvest festival',
    file_url: mockAudioFiles.mizoDrum,
    duration: 60,
    bpm: 120,
    key_signature: 'D Major',
    instrument_type: 'Percussion',
    cultural_origin: 'Mizo',
    cultural_context: 'These drums are essential to the Chapchar Kut festival, Mizoram\'s most celebrated spring festival. The rhythmic patterns tell stories of successful harvests and community unity.',
    mood_tags: ['energetic', 'celebratory', 'traditional'],
    usage_rights: 'commercial',
    price_personal: 8.00,
    price_commercial: 60.00,
    price_enterprise: 250.00,
    preview_url: mockAudioFiles.mizoDrum,
    waveform_data: Array(100).fill(0).map(() => Math.random() * 0.95 + 0.02),
    uploaded_by: null as string | null,
    is_active: true
  }
];

// Test user accounts
const testUsers = [
  {
    email: 'admin@culturalsoundlab.com',
    password: 'admin123456',
    name: 'Test Admin',
    role: 'admin' as const,
    cultural_affiliation: 'Mizo'
  },
  {
    email: 'contributor@culturalsoundlab.com',
    password: 'contributor123456',
    name: 'Cultural Contributor',
    role: 'cultural_contributor' as const,
    cultural_affiliation: 'Mizo'
  },
  {
    email: 'user@culturalsoundlab.com',
    password: 'user123456',
    name: 'Test User',
    role: 'user' as const,
    cultural_affiliation: null
  }
];

async function cleanDatabase() {
  console.log('🧹 Cleaning existing test data...');
  
  // Delete in order to respect foreign key constraints
  const { error: licensesError } = await supabase
    .from('licenses')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
  
  const { error: generationsError } = await supabase
    .from('generations')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
  
  const { error: samplesError } = await supabase
    .from('audio_samples')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
  
  const { error: revenueError } = await supabase
    .from('revenue_splits')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
  
  // Delete test users
  for (const user of testUsers) {
    const { data: existingUser } = await supabase.auth.admin.listUsers();
    const userToDelete = existingUser?.users.find(u => u.email === user.email);
    if (userToDelete) {
      await supabase.auth.admin.deleteUser(userToDelete.id);
    }
  }
  
  console.log('✅ Database cleaned');
}

async function createTestUsers() {
  console.log('👤 Creating test users...');
  const createdUsers: Record<string, string> = {};
  
  for (const userData of testUsers) {
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true
      });
      
      if (authError) {
        console.error(`Error creating auth user:`, authError.message);
        continue;
      }
      
      if (authData.user) {
        // Create user profile
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            name: userData.name,
            email: userData.email,
            role: userData.role,
            cultural_affiliation: userData.cultural_affiliation
          });
        
        if (profileError) {
          console.error(`Error creating profile for ${userData.email}:`, profileError);
        } else {
          createdUsers[userData.role] = authData.user.id;
          console.log(`✅ Created ${userData.role}: ${userData.email}`);
        }
      }
    } catch (error) {
      console.error(`Error creating user ${userData.email}:`, error);
    }
  }
  
  return createdUsers;
}

async function createAudioSamples(userIds: Record<string, string>) {
  console.log('🎵 Creating audio samples...');
  
  // Assign samples to the cultural contributor
  const contributorId = userIds['cultural_contributor'];
  
  for (const sample of mizoSamples) {
    sample.uploaded_by = contributorId;
    
    const { data, error } = await supabase
      .from('audio_samples')
      .insert(sample)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating audio sample:', error);
    } else {
      console.log(`✅ Created sample: ${sample.title}`);
    }
  }
}

async function createSampleGenerations(userIds: Record<string, string>) {
  console.log('🤖 Creating sample generations...');
  
  // Get audio samples
  const { data: samples } = await supabase
    .from('audio_samples')
    .select('id, title')
    .limit(1);
  
  if (samples && samples.length > 0) {
    const generation = {
      user_id: userIds['user'],
      source_sample_id: samples[0].id,
      generation_type: 'sound_logo' as const,
      parameters: {
        duration: 10,
        mood: 'energetic',
        style: 'modern'
      },
      status: 'completed' as const,
      file_url: 'https://storage.supabase.co/v1/object/public/generations/sound-logo-001.mp3',
      duration: 10,
      processing_time: 15.5
    };
    
    const { error } = await supabase
      .from('generations')
      .insert(generation);
    
    if (error) {
      console.error('Error creating generation:', error);
    } else {
      console.log('✅ Created sample generation');
    }
  }
}

async function createSampleLicenses(userIds: Record<string, string>) {
  console.log('📜 Creating sample licenses...');
  
  // Get a sample
  const { data: samples } = await supabase
    .from('audio_samples')
    .select('id, title, price_commercial')
    .limit(1);
  
  if (samples && samples.length > 0) {
    const license = {
      user_id: userIds['user'],
      audio_sample_id: samples[0].id,
      license_type: 'commercial' as const,
      usage_details: {
        company: 'Test Company',
        project: 'Marketing Campaign',
        duration: '1 year'
      },
      price: samples[0].price_commercial,
      payment_status: 'completed' as const,
      payment_id: 'test_payment_123',
      valid_until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
    };
    
    const { error } = await supabase
      .from('licenses')
      .insert(license);
    
    if (error) {
      console.error('Error creating license:', error);
    } else {
      console.log('✅ Created sample license');
    }
  }
}

async function setupTestData() {
  try {
    console.log('🚀 Starting test data setup...\n');
    
    // Clean existing data
    await cleanDatabase();
    
    // Create test users
    const userIds = await createTestUsers();
    
    // Create audio samples
    await createAudioSamples(userIds);
    
    // Create sample generations
    await createSampleGenerations(userIds);
    
    // Create sample licenses
    await createSampleLicenses(userIds);
    
    console.log('\n✅ Test data setup complete!');
    console.log('\n📋 Test Credentials:');
    console.log('Admin: admin@culturalsoundlab.com / admin123456');
    console.log('Contributor: contributor@culturalsoundlab.com / contributor123456');
    console.log('User: user@culturalsoundlab.com / user123456');
    
  } catch (error) {
    console.error('❌ Error setting up test data:', error);
    process.exit(1);
  }
}

// Run the setup
setupTestData();