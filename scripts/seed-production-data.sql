-- Cultural Sound Lab Production Data Seeder
-- Creates realistic data for production simulation

BEGIN;

-- Insert test users (10+ users)
INSERT INTO users (id, email, username, full_name, cultural_background, subscription_tier, total_earnings, is_verified, created_at) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', 'john.doe@example.com', 'johndoe', 'John Doe', 'Mizo', 'pro', 1250.75, true, NOW() - INTERVAL '6 months'),
    ('550e8400-e29b-41d4-a716-446655440002', 'sarah.chen@example.com', 'sarahc', 'Sarah Chen', 'Chinese', 'enterprise', 3420.50, true, NOW() - INTERVAL '5 months'),
    ('550e8400-e29b-41d4-a716-446655440003', 'miguel.rodriguez@example.com', 'mrodriguez', 'Miguel Rodriguez', 'Mexican', 'free', 0, false, NOW() - INTERVAL '4 months'),
    ('550e8400-e29b-41d4-a716-446655440004', 'priya.patel@example.com', 'priyap', 'Priya Patel', 'Indian', 'pro', 890.25, true, NOW() - INTERVAL '3 months'),
    ('550e8400-e29b-41d4-a716-446655440005', 'ahmed.hassan@example.com', 'ahmedh', 'Ahmed Hassan', 'Arabic', 'pro', 1560.80, true, NOW() - INTERVAL '8 months'),
    ('550e8400-e29b-41d4-a716-446655440006', 'elena.kowalski@example.com', 'elenank', 'Elena Kowalski', 'Polish', 'free', 0, false, NOW() - INTERVAL '2 months'),
    ('550e8400-e29b-41d4-a716-446655440007', 'takeshi.yamamoto@example.com', 'takeshiy', 'Takeshi Yamamoto', 'Japanese', 'enterprise', 2890.40, true, NOW() - INTERVAL '7 months'),
    ('550e8400-e29b-41d4-a716-446655440008', 'amara.okafor@example.com', 'amarao', 'Amara Okafor', 'Nigerian', 'pro', 1120.60, true, NOW() - INTERVAL '4 months'),
    ('550e8400-e29b-41d4-a716-446655440009', 'lars.andersen@example.com', 'larsa', 'Lars Andersen', 'Scandinavian', 'free', 0, false, NOW() - INTERVAL '1 month'),
    ('550e8400-e29b-41d4-a716-446655440010', 'sophia.garcia@example.com', 'sophiag', 'Sophia Garcia', 'Spanish', 'pro', 2340.15, true, NOW() - INTERVAL '9 months'),
    ('550e8400-e29b-41d4-a716-446655440011', 'kwame.asante@example.com', 'kwamea', 'Kwame Asante', 'Ghanaian', 'enterprise', 4120.90, true, NOW() - INTERVAL '1 year'),
    ('550e8400-e29b-41d4-a716-446655440012', 'admin@culturalsoundlab.com', 'admin', 'System Administrator', 'Mixed', 'enterprise', 0, true, NOW() - INTERVAL '1 year');

-- Update the last admin user to be an actual admin
UPDATE users SET is_admin = true WHERE email = 'admin@culturalsoundlab.com';

-- Insert cultural audio samples (50+ samples)
-- Mizo traditional instruments
INSERT INTO audio_samples (id, title, description, file_path, culture, region, instrument_type, traditional_name, mood, energy_level, tempo_bpm, rights_holder_id, royalty_percentage, quality_score, is_featured, created_at) VALUES
    ('660e8400-e29b-41d4-a716-446655440001', 'Traditional Mizo Bamboo Flute', 'Authentic bamboo flute melody from Mizoram hills', '/audio/mizo/bamboo_flute_1.mp3', 'Mizo', 'Mizoram, India', 'Wind', 'Rawchhem', 'peaceful', 'low', 72, '550e8400-e29b-41d4-a716-446655440001', 15.00, 9.2, true, NOW() - INTERVAL '5 months'),
    ('660e8400-e29b-41d4-a716-446655440002', 'Mizo Gong Ceremonial', 'Sacred gong used in traditional ceremonies', '/audio/mizo/gong_ceremonial.mp3', 'Mizo', 'Mizoram, India', 'Percussion', 'Darbu', 'ceremonial', 'medium', 60, '550e8400-e29b-41d4-a716-446655440001', 20.00, 9.5, true, NOW() - INTERVAL '4 months'),
    ('660e8400-e29b-41d4-a716-446655440003', 'Mizo String Instrument', 'Traditional string instrument played during festivals', '/audio/mizo/string_traditional.mp3', 'Mizo', 'Mizoram, India', 'String', 'Thlanrawkpa', 'festive', 'high', 120, '550e8400-e29b-41d4-a716-446655440001', 12.50, 8.8, false, NOW() - INTERVAL '3 months'),
    
-- Chinese traditional instruments
    ('660e8400-e29b-41d4-a716-446655440004', 'Ancient Chinese Guqin', 'Seven-stringed traditional Chinese instrument', '/audio/chinese/guqin_ancient.mp3', 'Chinese', 'Beijing, China', 'String', 'Guqin', 'meditative', 'low', 45, '550e8400-e29b-41d4-a716-446655440002', 18.00, 9.7, true, NOW() - INTERVAL '5 months'),
    ('660e8400-e29b-41d4-a716-446655440005', 'Chinese Erhu Melody', 'Traditional two-stringed violin', '/audio/chinese/erhu_melody.mp3', 'Chinese', 'Shanghai, China', 'String', 'Erhu', 'melancholic', 'medium', 80, '550e8400-e29b-41d4-a716-446655440002', 16.00, 9.1, true, NOW() - INTERVAL '4 months'),
    ('660e8400-e29b-41d4-a716-446655440006', 'Chinese Pipa Performance', 'Four-stringed traditional lute', '/audio/chinese/pipa_performance.mp3', 'Chinese', 'Guangzhou, China', 'String', 'Pipa', 'energetic', 'high', 140, '550e8400-e29b-41d4-a716-446655440002', 14.00, 8.9, false, NOW() - INTERVAL '3 months'),
    
-- Mexican traditional instruments
    ('660e8400-e29b-41d4-a716-446655440007', 'Mexican Mariachi Guitar', 'Traditional six-string guitar from mariachi ensemble', '/audio/mexican/mariachi_guitar.mp3', 'Mexican', 'Jalisco, Mexico', 'String', 'Guitarra', 'festive', 'high', 130, '550e8400-e29b-41d4-a716-446655440003', 10.00, 8.5, false, NOW() - INTERVAL '2 months'),
    ('660e8400-e29b-41d4-a716-446655440008', 'Mexican Marimba', 'Wooden percussion instrument with resonators', '/audio/mexican/marimba_traditional.mp3', 'Mexican', 'Chiapas, Mexico', 'Percussion', 'Marimba', 'joyful', 'medium', 100, '550e8400-e29b-41d4-a716-446655440003', 12.00, 9.0, true, NOW() - INTERVAL '1 month'),
    
-- Indian traditional instruments
    ('660e8400-e29b-41d4-a716-446655440009', 'Indian Sitar Classical', 'Traditional long-necked stringed instrument', '/audio/indian/sitar_classical.mp3', 'Indian', 'Varanasi, India', 'String', 'Sitar', 'spiritual', 'medium', 90, '550e8400-e29b-41d4-a716-446655440004', 20.00, 9.6, true, NOW() - INTERVAL '3 months'),
    ('660e8400-e29b-41d4-a716-446655440010', 'Indian Tabla Rhythm', 'Pair of hand drums', '/audio/indian/tabla_rhythm.mp3', 'Indian', 'Mumbai, India', 'Percussion', 'Tabla', 'rhythmic', 'high', 110, '550e8400-e29b-41d4-a716-446655440004', 15.00, 9.3, true, NOW() - INTERVAL '2 months'),
    
-- Arabic traditional instruments
    ('660e8400-e29b-41d4-a716-446655440011', 'Arabic Oud Melody', 'Traditional lute-type stringed instrument', '/audio/arabic/oud_melody.mp3', 'Arabic', 'Cairo, Egypt', 'String', 'Oud', 'contemplative', 'low', 65, '550e8400-e29b-41d4-a716-446655440005', 17.00, 9.4, true, NOW() - INTERVAL '6 months'),
    ('660e8400-e29b-41d4-a716-446655440012', 'Arabic Darbuka Rhythm', 'Goblet-shaped drum', '/audio/arabic/darbuka_rhythm.mp3', 'Arabic', 'Damascus, Syria', 'Percussion', 'Darbuka', 'energetic', 'high', 125, '550e8400-e29b-41d4-a716-446655440005', 13.00, 8.7, false, NOW() - INTERVAL '4 months');

-- Continue with more samples to reach 50+
-- (Adding abbreviated entries for space - in real implementation, expand to full 50+ samples)
INSERT INTO audio_samples (id, title, file_path, culture, instrument_type, mood, energy_level, tempo_bpm, rights_holder_id, royalty_percentage, quality_score, created_at) VALUES
    -- Polish samples
    ('660e8400-e29b-41d4-a716-446655440013', 'Polish Accordion Folk', '/audio/polish/accordion_folk.mp3', 'Polish', 'Wind', 'nostalgic', 'medium', 95, '550e8400-e29b-41d4-a716-446655440006', 11.00, 8.6, NOW() - INTERVAL '2 months'),
    ('660e8400-e29b-41d4-a716-446655440014', 'Polish Violin Traditional', '/audio/polish/violin_traditional.mp3', 'Polish', 'String', 'emotional', 'medium', 85, '550e8400-e29b-41d4-a716-446655440006', 14.00, 9.1, NOW() - INTERVAL '1 month'),
    
    -- Japanese samples
    ('660e8400-e29b-41d4-a716-446655440015', 'Japanese Koto Garden', '/audio/japanese/koto_garden.mp3', 'Japanese', 'String', 'serene', 'low', 55, '550e8400-e29b-41d4-a716-446655440007', 19.00, 9.8, NOW() - INTERVAL '5 months'),
    ('660e8400-e29b-41d4-a716-446655440016', 'Japanese Taiko Drums', '/audio/japanese/taiko_drums.mp3', 'Japanese', 'Percussion', 'powerful', 'high', 140, '550e8400-e29b-41d4-a716-446655440007', 16.00, 9.2, NOW() - INTERVAL '4 months'),
    
    -- Nigerian samples
    ('660e8400-e29b-41d4-a716-446655440017', 'Nigerian Talking Drum', '/audio/nigerian/talking_drum.mp3', 'Nigerian', 'Percussion', 'communicative', 'medium', 105, '550e8400-e29b-41d4-a716-446655440008', 12.50, 8.9, NOW() - INTERVAL '3 months'),
    ('660e8400-e29b-41d4-a716-446655440018', 'Nigerian Kalimba Thumb Piano', '/audio/nigerian/kalimba.mp3', 'Nigerian', 'Percussion', 'peaceful', 'low', 70, '550e8400-e29b-41d4-a716-446655440008', 13.50, 9.0, NOW() - INTERVAL '2 months');

-- Add more samples to reach 50+ (continuing pattern...)
-- For brevity, adding 32 more samples with varied data
DO $$
DECLARE
    sample_counter INTEGER := 19;
    cultures TEXT[] := ARRAY['Scandinavian', 'Spanish', 'Ghanaian', 'Aboriginal', 'Celtic', 'Andean', 'Tibetan', 'Korean'];
    instruments TEXT[] := ARRAY['String', 'Wind', 'Percussion'];
    moods TEXT[] := ARRAY['peaceful', 'energetic', 'mystical', 'festive', 'melancholic', 'powerful'];
    energy_levels TEXT[] := ARRAY['low', 'medium', 'high'];
    user_ids UUID[] := ARRAY[
        '550e8400-e29b-41d4-a716-446655440009'::UUID,
        '550e8400-e29b-41d4-a716-446655440010'::UUID,
        '550e8400-e29b-41d4-a716-446655440011'::UUID
    ];
BEGIN
    FOR i IN 1..32 LOOP
        INSERT INTO audio_samples (
            id, 
            title, 
            file_path, 
            culture, 
            instrument_type, 
            mood, 
            energy_level, 
            tempo_bpm, 
            rights_holder_id, 
            royalty_percentage, 
            quality_score, 
            created_at
        ) VALUES (
            ('660e8400-e29b-41d4-a716-44665544' || LPAD(sample_counter::TEXT, 4, '0'))::UUID,
            cultures[((i-1) % 8) + 1] || ' Sample ' || i,
            '/audio/' || LOWER(cultures[((i-1) % 8) + 1]) || '/sample_' || i || '.mp3',
            cultures[((i-1) % 8) + 1],
            instruments[((i-1) % 3) + 1],
            moods[((i-1) % 6) + 1],
            energy_levels[((i-1) % 3) + 1],
            60 + (i * 5) % 120,
            user_ids[((i-1) % 3) + 1],
            10.0 + (i % 10),
            8.0 + (random() * 2)::NUMERIC(3,2),
            NOW() - (i || ' days')::INTERVAL
        );
        sample_counter := sample_counter + 1;
    END LOOP;
END $$;

-- Insert audio generations (100+ generations)
-- Start with specific examples
INSERT INTO audio_generations (id, user_id, generation_type, source_sample_ids, duration_seconds, mood, energy_level, status, output_file_path, processing_time_seconds, created_at, processing_completed_at) VALUES
    ('770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'sound-logo', ARRAY['660e8400-e29b-41d4-a716-446655440001'], 15, 'peaceful', 'low', 'completed', '/generated/sound_logo_1.mp3', 45, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days' + INTERVAL '45 seconds'),
    ('770e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'playlist', ARRAY['660e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440005'], 300, 'meditative', 'low', 'completed', '/generated/playlist_1.mp3', 180, NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days' + INTERVAL '3 minutes'),
    ('770e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', 'social-clip', ARRAY['660e8400-e29b-41d4-a716-446655440007'], 30, 'festive', 'high', 'completed', '/generated/social_clip_1.mp3', 25, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day' + INTERVAL '25 seconds'),
    ('770e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440004', 'long-form', ARRAY['660e8400-e29b-41d4-a716-446655440009', '660e8400-e29b-41d4-a716-446655440010'], 600, 'spiritual', 'medium', 'completed', '/generated/long_form_1.mp3', 420, NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days' + INTERVAL '7 minutes'),
    ('770e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440005', 'sound-logo', ARRAY['660e8400-e29b-41d4-a716-446655440011'], 12, 'contemplative', 'low', 'processing', NULL, NULL, NOW() - INTERVAL '30 minutes', NULL),
    ('770e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440006', 'social-clip', ARRAY['660e8400-e29b-41d4-a716-446655440013'], 45, 'nostalgic', 'medium', 'failed', NULL, NULL, NOW() - INTERVAL '2 hours', NULL);

-- Generate 94 more generations to reach 100+
DO $$
DECLARE
    gen_counter INTEGER := 7;
    gen_types TEXT[] := ARRAY['sound-logo', 'playlist', 'social-clip', 'long-form'];
    gen_moods TEXT[] := ARRAY['peaceful', 'energetic', 'mystical', 'festive', 'melancholic', 'powerful'];
    gen_energy TEXT[] := ARRAY['low', 'medium', 'high'];
    gen_statuses TEXT[] := ARRAY['completed', 'completed', 'completed', 'processing', 'failed']; -- Weighted toward completed
    user_ids UUID[] := ARRAY[
        '550e8400-e29b-41d4-a716-446655440001'::UUID,
        '550e8400-e29b-41d4-a716-446655440002'::UUID,
        '550e8400-e29b-41d4-a716-446655440003'::UUID,
        '550e8400-e29b-41d4-a716-446655440004'::UUID,
        '550e8400-e29b-41d4-a716-446655440005'::UUID,
        '550e8400-e29b-41d4-a716-446655440006'::UUID,
        '550e8400-e29b-41d4-a716-446655440007'::UUID,
        '550e8400-e29b-41d4-a716-446655440008'::UUID,
        '550e8400-e29b-41d4-a716-446655440009'::UUID,
        '550e8400-e29b-41d4-a716-446655440010'::UUID
    ];
    selected_status TEXT;
    processing_time INT;
    output_path TEXT;
    completion_time TIMESTAMP WITH TIME ZONE;
BEGIN
    FOR i IN 1..94 LOOP
        selected_status := gen_statuses[((i-1) % 5) + 1];
        
        -- Set processing time and output based on status
        IF selected_status = 'completed' THEN
            processing_time := 30 + (random() * 300)::INT;
            output_path := '/generated/' || gen_types[((i-1) % 4) + 1] || '_' || gen_counter || '.mp3';
            completion_time := NOW() - (i || ' hours')::INTERVAL + (processing_time || ' seconds')::INTERVAL;
        ELSE
            processing_time := NULL;
            output_path := NULL;
            completion_time := NULL;
        END IF;

        INSERT INTO audio_generations (
            id,
            user_id,
            generation_type,
            source_sample_ids,
            duration_seconds,
            mood,
            energy_level,
            status,
            output_file_path,
            processing_time_seconds,
            created_at,
            processing_completed_at
        ) VALUES (
            ('770e8400-e29b-41d4-a716-44665544' || LPAD(gen_counter::TEXT, 4, '0'))::UUID,
            user_ids[((i-1) % 10) + 1],
            gen_types[((i-1) % 4) + 1],
            ARRAY[('660e8400-e29b-41d4-a716-44665544' || LPAD(((i-1) % 50 + 1)::TEXT, 4, '0'))::UUID],
            CASE gen_types[((i-1) % 4) + 1]
                WHEN 'sound-logo' THEN 10 + (random() * 10)::INT
                WHEN 'social-clip' THEN 30 + (random() * 30)::INT
                WHEN 'playlist' THEN 180 + (random() * 300)::INT
                WHEN 'long-form' THEN 300 + (random() * 600)::INT
            END,
            gen_moods[((i-1) % 6) + 1],
            gen_energy[((i-1) % 3) + 1],
            selected_status,
            output_path,
            processing_time,
            NOW() - (i || ' hours')::INTERVAL,
            completion_time
        );
        gen_counter := gen_counter + 1;
    END LOOP;
END $$;

-- Insert licenses (various types)
INSERT INTO licenses (id, user_id, license_type, generation_id, usage_rights, commercial_use, base_price, royalty_percentage, total_paid, payment_status, created_at) VALUES
    ('880e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'personal', '770e8400-e29b-41d4-a716-446655440001', 'Personal use only, no commercial applications', false, 9.99, 0, 9.99, 'completed', NOW() - INTERVAL '2 days'),
    ('880e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'commercial', '770e8400-e29b-41d4-a716-446655440002', 'Commercial use allowed, attribution required', true, 49.99, 5.00, 49.99, 'completed', NOW() - INTERVAL '3 days'),
    ('880e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', 'commercial', '770e8400-e29b-41d4-a716-446655440003', 'Social media commercial use', true, 29.99, 3.00, 29.99, 'completed', NOW() - INTERVAL '1 day'),
    ('880e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440004', 'enterprise', '770e8400-e29b-41d4-a716-446655440004', 'Full commercial rights, white-label allowed', true, 199.99, 10.00, 199.99, 'completed', NOW() - INTERVAL '5 days'),
    ('880e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440001', 'personal', '770e8400-e29b-41d4-a716-446655440001', 'Personal use only', false, 9.99, 0, 9.99, 'pending', NOW() - INTERVAL '1 hour');

-- Insert revenue splits
INSERT INTO revenue_splits (license_id, recipient_id, split_type, percentage, amount, status, processed_at) VALUES
    ('880e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'artist', 70.00, 34.99, 'paid', NOW() - INTERVAL '2 days'),
    ('880e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440012', 'platform', 25.00, 12.50, 'paid', NOW() - INTERVAL '2 days'),
    ('880e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440012', 'cultural_fund', 5.00, 2.50, 'paid', NOW() - INTERVAL '2 days'),
    ('880e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', 'artist', 70.00, 20.99, 'paid', NOW() - INTERVAL '1 day'),
    ('880e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440012', 'platform', 25.00, 7.50, 'paid', NOW() - INTERVAL '1 day'),
    ('880e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440012', 'cultural_fund', 5.00, 1.50, 'paid', NOW() - INTERVAL '1 day'),
    ('880e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440004', 'artist', 70.00, 139.99, 'paid', NOW() - INTERVAL '4 days'),
    ('880e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440012', 'platform', 25.00, 50.00, 'paid', NOW() - INTERVAL '4 days'),
    ('880e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440012', 'cultural_fund', 5.00, 10.00, 'paid', NOW() - INTERVAL '4 days');

-- Insert analytics events (sample tracking data)
INSERT INTO analytics_events (event_type, user_id, entity_type, entity_id, properties, ip_address, created_at) VALUES
    ('sample_played', '550e8400-e29b-41d4-a716-446655440001', 'sample', '660e8400-e29b-41d4-a716-446655440001', '{"duration": 30, "completion_rate": 0.8}', '192.168.1.100', NOW() - INTERVAL '1 hour'),
    ('sample_downloaded', '550e8400-e29b-41d4-a716-446655440002', 'sample', '660e8400-e29b-41d4-a716-446655440004', '{"format": "mp3", "quality": "high"}', '192.168.1.101', NOW() - INTERVAL '2 hours'),
    ('generation_started', '550e8400-e29b-41d4-a716-446655440003', 'generation', '770e8400-e29b-41d4-a716-446655440001', '{"type": "sound-logo", "duration": 15}', '192.168.1.102', NOW() - INTERVAL '2 days'),
    ('generation_completed', '550e8400-e29b-41d4-a716-446655440003', 'generation', '770e8400-e29b-41d4-a716-446655440001', '{"processing_time": 45, "success": true}', '192.168.1.102', NOW() - INTERVAL '2 days' + INTERVAL '45 seconds'),
    ('license_purchased', '550e8400-e29b-41d4-a716-446655440002', 'license', '880e8400-e29b-41d4-a716-446655440002', '{"amount": 49.99, "type": "commercial"}', '192.168.1.101', NOW() - INTERVAL '3 days'),
    ('user_registered', '550e8400-e29b-41d4-a716-446655440009', 'user', '550e8400-e29b-41d4-a716-446655440009', '{"source": "organic", "referrer": "google"}', '192.168.1.109', NOW() - INTERVAL '1 month'),
    ('user_login', '550e8400-e29b-41d4-a716-446655440001', 'user', '550e8400-e29b-41d4-a716-446655440001', '{"device": "desktop", "browser": "chrome"}', '192.168.1.100', NOW() - INTERVAL '30 minutes');

-- Insert system metrics for monitoring
INSERT INTO system_metrics (metric_name, metric_value, metric_unit, tags, recorded_at) VALUES
    ('cpu_usage_percent', 45.2, 'percent', '{"service": "api", "instance": "api-1"}', NOW()),
    ('memory_usage_bytes', 1073741824, 'bytes', '{"service": "api", "instance": "api-1"}', NOW()),
    ('db_connections_active', 12, 'count', '{"database": "postgres", "pool": "main"}', NOW()),
    ('generation_queue_size', 3, 'count', '{"queue": "audio_generation"}', NOW()),
    ('response_time_ms', 234, 'milliseconds', '{"endpoint": "/api/audio/samples", "method": "GET"}', NOW()),
    ('disk_usage_bytes', 21474836480, 'bytes', '{"mount": "/data", "type": "audio_storage"}', NOW()),
    ('requests_per_second', 15.7, 'per_second', '{"service": "api"}', NOW()),
    ('error_rate_percent', 0.5, 'percent', '{"service": "api", "status_code": "5xx"}', NOW());

COMMIT;

-- Display summary of seeded data
SELECT 
    'Users' as table_name, 
    COUNT(*) as record_count 
FROM users
UNION ALL
SELECT 
    'Audio Samples' as table_name, 
    COUNT(*) as record_count 
FROM audio_samples
UNION ALL
SELECT 
    'Generations' as table_name, 
    COUNT(*) as record_count 
FROM audio_generations
UNION ALL
SELECT 
    'Licenses' as table_name, 
    COUNT(*) as record_count 
FROM licenses
UNION ALL
SELECT 
    'Revenue Splits' as table_name, 
    COUNT(*) as record_count 
FROM revenue_splits
UNION ALL
SELECT 
    'Analytics Events' as table_name, 
    COUNT(*) as record_count 
FROM analytics_events
UNION ALL
SELECT 
    'System Metrics' as table_name, 
    COUNT(*) as record_count 
FROM system_metrics;