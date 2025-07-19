-- Add Razorpay customer ID to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS razorpay_customer_id VARCHAR(255);

-- Payment Orders table (Razorpay Orders)
CREATE TABLE IF NOT EXISTS payment_orders (
  id VARCHAR(255) PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'INR',
  status VARCHAR(50) NOT NULL,
  receipt VARCHAR(255),
  payment_id VARCHAR(255),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments table (Razorpay Payments)
CREATE TABLE IF NOT EXISTS payments (
  id VARCHAR(255) PRIMARY KEY,
  order_id VARCHAR(255),
  subscription_id VARCHAR(255),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'INR',
  status VARCHAR(50) NOT NULL,
  method VARCHAR(50),
  fee DECIMAL(10,2) DEFAULT 0,
  tax DECIMAL(10,2) DEFAULT 0,
  error_code VARCHAR(100),
  error_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (order_id) REFERENCES payment_orders(id) ON DELETE SET NULL
);

-- Update Subscriptions table for Razorpay
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS plan_id VARCHAR(255);
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS current_start TIMESTAMP WITH TIME ZONE;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS current_end TIMESTAMP WITH TIME ZONE;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS ended_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS total_count INTEGER;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS paid_count INTEGER DEFAULT 0;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS remaining_count INTEGER;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS notes JSONB;

-- Update Refunds table for Razorpay
ALTER TABLE refunds DROP CONSTRAINT IF EXISTS refunds_payment_intent_id_fkey;
ALTER TABLE refunds ADD COLUMN IF NOT EXISTS payment_id VARCHAR(255);
ALTER TABLE refunds ADD COLUMN IF NOT EXISTS notes JSONB;
ALTER TABLE refunds ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update foreign key for refunds
ALTER TABLE refunds ADD CONSTRAINT refunds_payment_id_fkey 
  FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE;

-- Update Invoices table for Razorpay
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(255);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS due_by TIMESTAMP WITH TIME ZONE;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS description TEXT;

-- User Licenses table for tracking granted licenses
CREATE TABLE IF NOT EXISTS user_licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  license_id UUID NOT NULL,
  payment_id VARCHAR(255),
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  granted_at TIMESTAMP WITH TIME ZONE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE SET NULL,
  UNIQUE(user_id, license_id)
);

-- Subscription Plans table (Razorpay Plans)
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  razorpay_plan_id VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'INR',
  period VARCHAR(20) NOT NULL, -- 'daily', 'weekly', 'monthly', 'yearly'
  interval_count INTEGER NOT NULL DEFAULT 1,
  features JSONB,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payment_orders_user_id ON payment_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_status ON payment_orders(status);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_subscription_id ON payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_user_licenses_user_id ON user_licenses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_licenses_license_id ON user_licenses(license_id);
CREATE INDEX IF NOT EXISTS idx_user_licenses_payment_id ON user_licenses(payment_id);
CREATE INDEX IF NOT EXISTS idx_users_razorpay_customer_id ON users(razorpay_customer_id);

-- Insert default subscription plans for Razorpay (INR pricing)
INSERT INTO subscription_plans (razorpay_plan_id, name, description, amount, period, features)
VALUES 
  ('plan_basic_monthly', 'Basic Plan', 'Essential features for individual creators', 799.00, 'monthly', '{"generations_per_month": 50, "download_quality": "standard", "support": "email"}'),
  ('plan_pro_monthly', 'Pro Plan', 'Advanced features for professional creators', 2499.00, 'monthly', '{"generations_per_month": 200, "download_quality": "premium", "support": "priority", "custom_samples": true}'),
  ('plan_enterprise_monthly', 'Enterprise Plan', 'Full access for teams and businesses', 8299.00, 'monthly', '{"generations_per_month": "unlimited", "download_quality": "premium", "support": "dedicated", "custom_samples": true, "white_label": true}')
ON CONFLICT (razorpay_plan_id) DO NOTHING;