-- Add display_name_en column to categories table
ALTER TABLE categories ADD COLUMN display_name_en TEXT;

-- Update existing categories with English display names
-- You can customize these translations as needed
UPDATE categories SET display_name_en = 
  CASE 
    WHEN display_name_tr = 'Kurumsal Fotoğraf' THEN 'Corporate Photography'
    WHEN display_name_tr = 'Yaratıcı Portre' THEN 'Creative Portrait'
    WHEN display_name_tr = 'Avatar Oluşturucu' THEN 'Avatar Creator'
    WHEN display_name_tr = 'Profesyonel Headshot' THEN 'Professional Headshot'
    WHEN display_name_tr = 'Sanatsal Portre' THEN 'Artistic Portrait'
    WHEN display_name_tr = 'Moda Fotoğrafı' THEN 'Fashion Photography'
    WHEN display_name_tr = 'Düğün Fotoğrafı' THEN 'Wedding Photography'
    WHEN display_name_tr = 'Çocuk Fotoğrafı' THEN 'Children Photography'
    WHEN display_name_tr = 'Aile Fotoğrafı' THEN 'Family Photography'
    WHEN display_name_tr = 'Doğa Fotoğrafı' THEN 'Nature Photography'
    ELSE display_name_tr -- fallback to Turkish if no translation found
  END;

-- Make display_name_en NOT NULL after setting default values
ALTER TABLE categories ALTER COLUMN display_name_en SET NOT NULL;

-- Grant permissions to anon and authenticated roles
GRANT SELECT ON categories TO anon;
GRANT ALL PRIVILEGES ON categories TO authenticated;