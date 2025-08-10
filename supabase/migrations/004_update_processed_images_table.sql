-- Add prompt column to processed_images table
ALTER TABLE processed_images 
ADD COLUMN IF NOT EXISTS prompt TEXT;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_processed_images_job_id ON processed_images(job_id);

-- Grant permissions to authenticated and anon roles
GRANT SELECT, INSERT, UPDATE, DELETE ON processed_images TO authenticated;
GRANT SELECT ON processed_images TO anon;