-- Add before_image_url and after_image_url columns to categories table
ALTER TABLE categories 
ADD COLUMN before_image_url TEXT,
ADD COLUMN after_image_url TEXT;

-- Migrate existing image_url data to before_image_url
UPDATE categories 
SET before_image_url = image_url 
WHERE image_url IS NOT NULL;

-- Add comments for clarity
COMMENT ON COLUMN categories.before_image_url IS 'URL for the before image in before/after comparison';
COMMENT ON COLUMN categories.after_image_url IS 'URL for the after image in before/after comparison';