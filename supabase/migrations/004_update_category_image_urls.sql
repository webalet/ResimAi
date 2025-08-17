-- Update category image URLs to use correct /uploads/ paths
UPDATE categories 
SET image_url = 'http://64.226.75.76/uploads/category_1755423501765_ws3fwva0bi.jpg'
WHERE name = 'corporate_photography';

UPDATE categories 
SET image_url = '/images/yaratici-portre.jpg'
WHERE name = 'creative_portrait';

-- Check updated values
SELECT name, display_name_tr, image_url FROM categories ORDER BY name;