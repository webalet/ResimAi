-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    credits INTEGER DEFAULT 10,
    stripe_customer_id VARCHAR(255),
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    image_url TEXT,
    styles TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create image_jobs table
CREATE TABLE IF NOT EXISTS image_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    category_type VARCHAR(100) NOT NULL,
    style VARCHAR(255) NOT NULL,
    original_image_url TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create processed_images table
CREATE TABLE IF NOT EXISTS processed_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES image_jobs(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stripe_subscription_id VARCHAR(255) UNIQUE NOT NULL,
    stripe_customer_id VARCHAR(255) NOT NULL,
    plan_name VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'unpaid')),
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    canceled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create credits_usage table
CREATE TABLE IF NOT EXISTS credits_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_id UUID REFERENCES image_jobs(id) ON DELETE SET NULL,
    credits_used INTEGER NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    stripe_payment_intent_id VARCHAR(255) UNIQUE NOT NULL,
    amount INTEGER NOT NULL, -- Amount in cents
    currency VARCHAR(3) DEFAULT 'usd',
    status VARCHAR(50) NOT NULL,
    credits_added INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer ON users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(type);
CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active);
CREATE INDEX IF NOT EXISTS idx_image_jobs_user ON image_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_image_jobs_status ON image_jobs(status);
CREATE INDEX IF NOT EXISTS idx_image_jobs_created ON image_jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_processed_images_job ON processed_images(job_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_credits_usage_user ON credits_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_image_jobs_updated_at BEFORE UPDATE ON image_jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE image_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE processed_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE credits_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- Users policies
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid()::text = id::text);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid()::text = id::text);
CREATE POLICY "Users can delete own account" ON users FOR DELETE USING (auth.uid()::text = id::text);

-- Categories policies (public read, admin write)
CREATE POLICY "Anyone can view active categories" ON categories FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage categories" ON categories FOR ALL USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id::text = auth.uid()::text 
        AND users.is_admin = true
    )
);

-- Image jobs policies
CREATE POLICY "Users can view own jobs" ON image_jobs FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can create own jobs" ON image_jobs FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "Users can update own jobs" ON image_jobs FOR UPDATE USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can delete own jobs" ON image_jobs FOR DELETE USING (auth.uid()::text = user_id::text);

-- Processed images policies
CREATE POLICY "Users can view own processed images" ON processed_images FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM image_jobs 
        WHERE image_jobs.id = processed_images.job_id 
        AND image_jobs.user_id::text = auth.uid()::text
    )
);
CREATE POLICY "System can insert processed images" ON processed_images FOR INSERT WITH CHECK (true);

-- Subscriptions policies
CREATE POLICY "Users can view own subscriptions" ON subscriptions FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can create own subscriptions" ON subscriptions FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "Users can update own subscriptions" ON subscriptions FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Credits usage policies
CREATE POLICY "Users can view own credits usage" ON credits_usage FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "System can insert credits usage" ON credits_usage FOR INSERT WITH CHECK (true);

-- Payments policies
CREATE POLICY "Users can view own payments" ON payments FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "System can insert payments" ON payments FOR INSERT WITH CHECK (true);

-- Grant permissions to anon and authenticated roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Grant limited permissions to anon role
GRANT SELECT ON categories TO anon;

-- Insert default categories
INSERT INTO categories (name, type, description, styles, image_url) VALUES
('Kurumsal Fotoğraf', 'Corporate', 'Profesyonel iş dünyası için kurumsal fotoğraflar', ARRAY['Klasik', 'Modern', 'Resmi'], 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20corporate%20headshot%20business%20attire%20office%20background&image_size=square'),
('LinkedIn Profil', 'LinkedIn', 'LinkedIn profili için optimize edilmiş profesyonel fotoğraflar', ARRAY['Profesyonel', 'Samimi', 'Güvenilir'], 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=linkedin%20profile%20photo%20professional%20business%20portrait&image_size=square'),
('Yaratıcı Portre', 'Creative', 'Sanatsal ve yaratıcı portre fotoğrafları', ARRAY['Sanatsal', 'Renkli', 'Minimalist'], 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=creative%20artistic%20portrait%20colorful%20unique%20style&image_size=square'),
('Avatar Oluştur', 'Avatar', 'Dijital avatar ve karakter fotoğrafları', ARRAY['Çizgi Film', 'Realistik', 'Fantastik'], 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=digital%20avatar%20character%20portrait%20stylized&image_size=square'),
('Arka Plan Değiştir', 'Background', 'Profesyonel arka plan değiştirme hizmeti', ARRAY['Ofis', 'Doğa', 'Stüdyo'], 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20background%20office%20studio%20setting&image_size=square');

-- Create admin user (password: admin123)
INSERT INTO users (name, email, password_hash, credits, is_admin) VALUES
('Admin User', 'admin@resim.ai', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1000, true);