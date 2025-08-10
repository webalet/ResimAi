-- Update existing categories to use the default image
UPDATE categories 
SET image_url = '/images/ornek.jpg'
WHERE image_url IS NULL OR image_url = '' OR image_url LIKE 'https://via.placeholder.com%' OR image_url LIKE 'https://trae-api-sg.mchost.guru%';

-- Update specific categories with the default image if they have broken URLs
UPDATE categories 
SET image_url = '/images/ornek.jpg'
WHERE image_url LIKE 'https://%';