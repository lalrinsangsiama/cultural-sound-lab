-- Cultural Sound Lab Database Schema
-- Production simulation setup

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    avatar_url TEXT,
    bio TEXT,
    cultural_background VARCHAR(100),
    is_verified BOOLEAN DEFAULT FALSE,
    is_admin BOOLEAN DEFAULT FALSE,
    subscription_tier VARCHAR(50) DEFAULT 'free',
    total_earnings DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- Audio samples table
CREATE TABLE audio_samples (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT,
    duration_seconds FLOAT,
    sample_rate INTEGER,
    bit_depth INTEGER,
    format VARCHAR(10),
    
    -- Cultural metadata
    culture VARCHAR(100) NOT NULL,
    region VARCHAR(100),
    instrument_type VARCHAR(100),
    traditional_name VARCHAR(255),
    cultural_significance TEXT,
    usage_guidelines TEXT,
    
    -- Categorization
    mood VARCHAR(50),
    energy_level VARCHAR(20),
    tempo_bpm INTEGER,
    key_signature VARCHAR(10),
    
    -- Rights and licensing
    rights_holder_id UUID REFERENCES users(id),
    license_type VARCHAR(50) DEFAULT 'standard',
    royalty_percentage DECIMAL(5,2) DEFAULT 10.00,
    
    -- Usage tracking
    download_count INTEGER DEFAULT 0,
    generation_count INTEGER DEFAULT 0,
    revenue_generated DECIMAL(10,2) DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    quality_score DECIMAL(3,2),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audio generations table
CREATE TABLE audio_generations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) NOT NULL,
    generation_type VARCHAR(50) NOT NULL, -- 'sound-logo', 'playlist', 'social-clip', 'long-form'
    
    -- Input parameters
    source_sample_ids UUID[],
    duration_seconds INTEGER,
    mood VARCHAR(50),
    energy_level VARCHAR(20),
    style_parameters JSONB,
    custom_prompt TEXT,
    
    -- Output
    output_file_path VARCHAR(500),
    output_file_size BIGINT,
    output_duration FLOAT,
    
    -- Processing
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    processing_started_at TIMESTAMP WITH TIME ZONE,
    processing_completed_at TIMESTAMP WITH TIME ZONE,
    processing_time_seconds INTEGER,
    error_message TEXT,
    
    -- Usage and licensing
    license_id UUID,
    download_count INTEGER DEFAULT 0,
    public_url TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Licenses table
CREATE TABLE licenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) NOT NULL,
    license_type VARCHAR(50) NOT NULL, -- 'personal', 'commercial', 'enterprise'
    
    -- Licensed content
    generation_id UUID REFERENCES audio_generations(id),
    sample_ids UUID[],
    
    -- Terms
    usage_rights TEXT NOT NULL,
    attribution_required BOOLEAN DEFAULT TRUE,
    commercial_use BOOLEAN DEFAULT FALSE,
    derivative_works BOOLEAN DEFAULT FALSE,
    distribution_allowed BOOLEAN DEFAULT FALSE,
    
    -- Pricing
    base_price DECIMAL(10,2) NOT NULL,
    royalty_percentage DECIMAL(5,2),
    total_paid DECIMAL(10,2),
    
    -- Validity
    valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    valid_until TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Payment
    payment_status VARCHAR(20) DEFAULT 'pending',
    payment_id VARCHAR(255),
    payment_method VARCHAR(50),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Revenue splits table
CREATE TABLE revenue_splits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    license_id UUID REFERENCES licenses(id) NOT NULL,
    recipient_id UUID REFERENCES users(id) NOT NULL,
    
    -- Split details
    split_type VARCHAR(50) NOT NULL, -- 'artist', 'platform', 'cultural_fund'
    percentage DECIMAL(5,2) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    
    -- Processing
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processed', 'paid'
    processed_at TIMESTAMP WITH TIME ZONE,
    payment_reference VARCHAR(255),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics events table
CREATE TABLE analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(50) NOT NULL,
    user_id UUID REFERENCES users(id),
    session_id VARCHAR(255),
    
    -- Event data
    entity_type VARCHAR(50), -- 'sample', 'generation', 'license'
    entity_id UUID,
    properties JSONB,
    
    -- Context
    ip_address INET,
    user_agent TEXT,
    referrer TEXT,
    page_url TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System health metrics table
CREATE TABLE system_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,4) NOT NULL,
    metric_unit VARCHAR(20),
    tags JSONB,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_subscription_tier ON users(subscription_tier);
CREATE INDEX idx_users_created_at ON users(created_at);

CREATE INDEX idx_audio_samples_culture ON audio_samples(culture);
CREATE INDEX idx_audio_samples_instrument ON audio_samples(instrument_type);
CREATE INDEX idx_audio_samples_mood ON audio_samples(mood);
CREATE INDEX idx_audio_samples_is_active ON audio_samples(is_active);
CREATE INDEX idx_audio_samples_rights_holder ON audio_samples(rights_holder_id);
CREATE INDEX idx_audio_samples_created_at ON audio_samples(created_at);

CREATE INDEX idx_generations_user_id ON audio_generations(user_id);
CREATE INDEX idx_generations_type ON audio_generations(generation_type);
CREATE INDEX idx_generations_status ON audio_generations(status);
CREATE INDEX idx_generations_created_at ON audio_generations(created_at);

CREATE INDEX idx_licenses_user_id ON licenses(user_id);
CREATE INDEX idx_licenses_type ON licenses(license_type);
CREATE INDEX idx_licenses_status ON licenses(is_active);
CREATE INDEX idx_licenses_created_at ON licenses(created_at);

CREATE INDEX idx_revenue_splits_license_id ON revenue_splits(license_id);
CREATE INDEX idx_revenue_splits_recipient ON revenue_splits(recipient_id);
CREATE INDEX idx_revenue_splits_status ON revenue_splits(status);

CREATE INDEX idx_analytics_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_user_id ON analytics_events(user_id);
CREATE INDEX idx_analytics_entity ON analytics_events(entity_type, entity_id);
CREATE INDEX idx_analytics_created_at ON analytics_events(created_at);

CREATE INDEX idx_metrics_name ON system_metrics(metric_name);
CREATE INDEX idx_metrics_recorded_at ON system_metrics(recorded_at);

-- Create triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_audio_samples_updated_at BEFORE UPDATE ON audio_samples
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_audio_generations_updated_at BEFORE UPDATE ON audio_generations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_licenses_updated_at BEFORE UPDATE ON licenses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Performance monitoring views
CREATE VIEW performance_summary AS
SELECT 
    'total_users' as metric,
    COUNT(*)::text as value,
    NOW() as last_updated
FROM users
UNION ALL
SELECT 
    'active_samples' as metric,
    COUNT(*)::text as value,
    NOW() as last_updated
FROM audio_samples WHERE is_active = true
UNION ALL
SELECT 
    'total_generations' as metric,
    COUNT(*)::text as value,
    NOW() as last_updated
FROM audio_generations
UNION ALL
SELECT 
    'completed_generations' as metric,
    COUNT(*)::text as value,
    NOW() as last_updated
FROM audio_generations WHERE status = 'completed'
UNION ALL
SELECT 
    'total_revenue' as metric,
    COALESCE(SUM(total_paid), 0)::text as value,
    NOW() as last_updated
FROM licenses WHERE payment_status = 'completed';

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO csl_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO csl_user;