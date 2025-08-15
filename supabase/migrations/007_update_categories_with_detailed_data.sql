-- Update categories table with detailed multilingual data

-- First, add missing columns if they don't exist
ALTER TABLE categories ADD COLUMN IF NOT EXISTS display_name_en VARCHAR;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS description_en TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS styles_en TEXT[];

-- Temporarily disable foreign key constraint
ALTER TABLE image_jobs DROP CONSTRAINT IF EXISTS image_jobs_category_id_fkey;

-- Clear existing data that might cause conflicts
DELETE FROM image_jobs;
DELETE FROM categories;

-- Insert updated categories with detailed data
INSERT INTO categories (
  name, 
  display_name_tr, 
  display_name_en, 
  type, 
  description, 
  description_en, 
  image_url, 
  styles, 
  styles_en, 
  is_active
) VALUES 
(
  'Corporate',
  'Kurumsal Fotoğraf',
  'Corporate Photography',
  'Corporate',
  'Profesyonel iş dünyası için kurumsal fotoğraflar. Yönetici pozisyonları, şirket profilleri ve resmi toplantılar için ideal.',
  'Professional corporate photography for business world. Perfect for executive positions, company profiles and formal meetings.',
  '/images/ornek.jpg',
  ARRAY['Professional', 'Business Casual', 'Executive', 'Formal Meeting', 'Leadership', 'Corporate Headshot'],
  ARRAY['Professional', 'Business Casual', 'Executive', 'Formal Meeting', 'Leadership', 'Corporate Headshot'],
  true
),
(
  'Creative',
  'Yaratıcı Portre',
  'Creative Portrait',
  'Creative',
  'Sanatsal ve yaratıcı portre fotoğrafları. Özgün tarzınızı yansıtan, artistik ve etkileyici görüntüler.',
  'Artistic and creative portrait photography. Unique images that reflect your personal style with artistic and impressive visuals.',
  '/images/ornek.jpg',
  ARRAY['Artistic', 'Bohemian', 'Vintage', 'Modern Art', 'Abstract', 'Dramatic'],
  ARRAY['Artistic', 'Bohemian', 'Vintage', 'Modern Art', 'Abstract', 'Dramatic'],
  true
),
(
  'Avatar',
  'Avatar Oluşturucu',
  'Avatar Creator',
  'Avatar',
  'Dijital avatar ve karakter fotoğrafları. Sosyal medya profilleri, oyun karakterleri ve dijital kimlik için.',
  'Digital avatar and character photography. Perfect for social media profiles, gaming characters and digital identity.',
  '/images/ornek.jpg',
  ARRAY['Cartoon', 'Realistic', 'Anime', 'Fantasy', 'Superhero', 'Gaming'],
  ARRAY['Cartoon', 'Realistic', 'Anime', 'Fantasy', 'Superhero', 'Gaming'],
  true
),
(
  'Outfit',
  'Elbise Değişimi',
  'Outfit Change',
  'Outfit',
  'AI ile kıyafet değiştirme ve stil önerileri. Farklı kıyafet kombinasyonlarını deneyimleyin.',
  'AI-powered outfit change and style suggestions. Experience different clothing combinations effortlessly.',
  '/images/ornek.jpg',
  ARRAY['Casual', 'Formal', 'Sporty', 'Trendy', 'Business', 'Evening'],
  ARRAY['Casual', 'Formal', 'Sporty', 'Trendy', 'Business', 'Evening'],
  true
),
(
  'Background',
  'Arkaplan Değiştirme',
  'Background Change',
  'Background',
  'Profesyonel arka plan değiştirme hizmeti. Fotoğraflarınızı istediğiniz ortamda gösterin.',
  'Professional background change service. Showcase your photos in any environment you desire.',
  '/images/ornek.jpg',
  ARRAY['Office', 'Studio', 'Nature', 'Abstract', 'Urban', 'Luxury'],
  ARRAY['Office', 'Studio', 'Nature', 'Abstract', 'Urban', 'Luxury'],
  true
),
(
  'Skincare',
  'Cilt Düzeltme',
  'Skin Enhancement',
  'Skincare',
  'AI destekli cilt düzeltme ve güzelleştirme. Doğal görünümlü, pürüzsüz ve parlak cilt.',
  'AI-powered skin correction and enhancement. Natural-looking, smooth and radiant skin.',
  '/images/ornek.jpg',
  ARRAY['Natural', 'Glowing', 'Professional', 'Fresh', 'Radiant', 'Flawless'],
  ARRAY['Natural', 'Glowing', 'Professional', 'Fresh', 'Radiant', 'Flawless'],
  true
);

-- Re-enable foreign key constraint
ALTER TABLE image_jobs ADD CONSTRAINT image_jobs_category_id_fkey 
  FOREIGN KEY (category_id) REFERENCES categories(id);

-- Grant permissions to anon and authenticated roles
GRANT SELECT ON categories TO anon;
GRANT ALL PRIVILEGES ON categories TO authenticated;