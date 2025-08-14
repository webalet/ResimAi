-- Add styles_en and description_en columns to categories table
ALTER TABLE categories ADD COLUMN styles_en TEXT[];
ALTER TABLE categories ADD COLUMN description_en TEXT;

-- Update existing categories with English styles and descriptions
-- You can customize these translations as needed
UPDATE categories SET styles_en = 
  CASE 
    WHEN name = 'corporate' THEN ARRAY['Classic', 'Modern', 'Formal']
    WHEN name = 'portrait' THEN ARRAY['Artistic', 'Colorful', 'Minimalist']
    WHEN name = 'avatar' THEN ARRAY['Cartoon Film', 'Realistic', 'Fantasy']
    ELSE styles -- fallback to Turkish if no translation found
  END;

UPDATE categories SET description_en = 
  CASE 
    WHEN display_name_tr = 'Kurumsal Fotoğraf' THEN 'Professional corporate photography for business world'
    WHEN display_name_tr = 'Yaratıcı Portre' THEN 'Artistic and creative portrait photography'
    WHEN display_name_tr = 'Avatar Oluşturucu' THEN 'Digital avatar and character photography'
    WHEN display_name_tr = 'Profesyonel Headshot' THEN 'Professional headshot photography'
    WHEN display_name_tr = 'Sanatsal Portre' THEN 'Artistic portrait photography'
    WHEN display_name_tr = 'Moda Fotoğrafı' THEN 'Fashion photography'
    WHEN display_name_tr = 'Düğün Fotoğrafı' THEN 'Wedding photography'
    WHEN display_name_tr = 'Çocuk Fotoğrafı' THEN 'Children photography'
    WHEN display_name_tr = 'Aile Fotoğrafı' THEN 'Family photography'
    WHEN display_name_tr = 'Doğa Fotoğrafı' THEN 'Nature photography'
    ELSE description -- fallback to Turkish if no translation found
  END;

-- Make styles_en and description_en NOT NULL after setting default values
ALTER TABLE categories ALTER COLUMN styles_en SET NOT NULL;
ALTER TABLE categories ALTER COLUMN description_en SET NOT NULL;

-- Grant permissions to anon and authenticated roles
GRANT SELECT ON categories TO anon;
GRANT ALL PRIVILEGES ON categories TO authenticated;