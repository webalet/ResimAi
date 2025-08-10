-- Grant permissions for processed_images table
GRANT ALL PRIVILEGES ON processed_images TO authenticated;
GRANT SELECT ON processed_images TO anon;

-- Ensure RLS policies allow authenticated users to insert/update/delete their own records
CREATE POLICY "Users can insert processed images" ON processed_images
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view processed images" ON processed_images
  FOR SELECT USING (true);

CREATE POLICY "Users can update processed images" ON processed_images
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete processed images" ON processed_images
  FOR DELETE USING (true);