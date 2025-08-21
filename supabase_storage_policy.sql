-- Storage policies for character images bucket
-- Run this in your Supabase SQL Editor

-- Create bucket policy to allow public read access
CREATE POLICY "Public read access for character images" ON storage.objects
FOR SELECT TO PUBLIC
USING (bucket_id = 'character-images');

-- Create bucket policy to allow public upload access
CREATE POLICY "Public upload access for character images" ON storage.objects
FOR INSERT TO PUBLIC
WITH CHECK (bucket_id = 'character-images');

-- Create bucket policy to allow public update access
CREATE POLICY "Public update access for character images" ON storage.objects
FOR UPDATE TO PUBLIC
USING (bucket_id = 'character-images')
WITH CHECK (bucket_id = 'character-images');

-- Create bucket policy to allow public delete access
CREATE POLICY "Public delete access for character images" ON storage.objects
FOR DELETE TO PUBLIC
USING (bucket_id = 'character-images');

-- Ensure the bucket exists and is public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'character-images';
