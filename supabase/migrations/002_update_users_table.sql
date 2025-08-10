-- Add missing columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 1;
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Update subscriptions table to match our schema
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255);
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS plan_name VARCHAR(100);
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update image_jobs table to match our schema
ALTER TABLE image_jobs ADD COLUMN IF NOT EXISTS category_id UUID;
ALTER TABLE image_jobs ADD COLUMN IF NOT EXISTS style VARCHAR(255);
ALTER TABLE image_jobs ADD COLUMN IF NOT EXISTS error_message TEXT;
ALTER TABLE image_jobs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update categories table to match our schema
ALTER TABLE categories ADD COLUMN IF NOT EXISTS type VARCHAR(100);
ALTER TABLE categories ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS styles TEXT[];
ALTER TABLE categories ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update payments table to match our schema
ALTER TABLE payments ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS stripe_payment_intent_id VARCHAR(255);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS credits_added INTEGER DEFAULT 0;

-- Add foreign key constraints if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'image_jobs_category_id_fkey'
    ) THEN
        ALTER TABLE image_jobs ADD CONSTRAINT image_jobs_category_id_fkey 
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'payments_user_id_fkey'
    ) THEN
        ALTER TABLE payments ADD CONSTRAINT payments_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

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

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_image_jobs_updated_at ON image_jobs;
CREATE TRIGGER update_image_jobs_updated_at BEFORE UPDATE ON image_jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update categories with our data if they don't exist
INSERT INTO categories (name, display_name_tr, type, description, styles, image_url) 
SELECT 'Corporate', 'Kurumsal Fotoğraf', 'Corporate', 'Profesyonel iş dünyası için kurumsal fotoğraflar', ARRAY['Klasik', 'Modern', 'Resmi'], 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20corporate%20headshot%20business%20attire%20office%20background&image_size=square'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE type = 'Corporate');

INSERT INTO categories (name, display_name_tr, type, description, styles, image_url) 
SELECT 'LinkedIn', 'LinkedIn Profil', 'LinkedIn', 'LinkedIn profili için optimize edilmiş profesyonel fotoğraflar', ARRAY['Profesyonel', 'Samimi', 'Güvenilir'], 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=linkedin%20profile%20photo%20professional%20business%20portrait&image_size=square'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE type = 'LinkedIn');

INSERT INTO categories (name, display_name_tr, type, description, styles, image_url) 
SELECT 'Creative', 'Yaratıcı Portre', 'Creative', 'Sanatsal ve yaratıcı portre fotoğrafları', ARRAY['Sanatsal', 'Renkli', 'Minimalist'], 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=creative%20artistic%20portrait%20colorful%20unique%20style&image_size=square'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE type = 'Creative');

INSERT INTO categories (name, display_name_tr, type, description, styles, image_url) 
SELECT 'Avatar', 'Avatar Oluştur', 'Avatar', 'Dijital avatar ve karakter fotoğrafları', ARRAY['Çizgi Film', 'Realistik', 'Fantastik'], 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=digital%20avatar%20character%20portrait%20stylized&image_size=square'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE type = 'Avatar');

INSERT INTO categories (name, display_name_tr, type, description, styles, image_url) 
SELECT 'Background', 'Arka Plan Değiştir', 'Background', 'Profesyonel arka plan değiştirme hizmeti', ARRAY['Ofis', 'Doğa', 'Stüdyo'], 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20background%20office%20studio%20setting&image_size=square'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE type = 'Background');

-- Create admin user if it doesn't exist (password: admin123)
INSERT INTO users (name, email, password_hash, credits, is_admin) 
SELECT 'Admin User', 'admin@resim.ai', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1000, true
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@resim.ai');

-- Grant permissions to anon and authenticated roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Grant limited permissions to anon role
GRANT SELECT ON categories TO anon;