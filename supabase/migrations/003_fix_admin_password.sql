-- Fix admin user password hash
UPDATE users 
SET password_hash = '$2b$10$4hs/AeWMQw60RiKAc51Ol.SOpRlgge9A.5TIZiK1mNhjDq/5mWFeS'
WHERE email = 'admin@resim.ai' AND is_admin = true;