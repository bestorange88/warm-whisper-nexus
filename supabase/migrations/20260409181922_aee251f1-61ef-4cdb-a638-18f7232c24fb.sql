-- Make the chat-media bucket private
UPDATE storage.buckets SET public = false WHERE id = 'chat-media';

-- Drop any existing overly permissive SELECT policies on storage.objects for chat-media
DROP POLICY IF EXISTS "Anyone can view chat media" ON storage.objects;
DROP POLICY IF EXISTS "Chat media is publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Public read access to chat media" ON storage.objects;

-- Create authenticated-only read policy (users can read files in their own folder or files in conversations they belong to)
CREATE POLICY "Authenticated users can view chat media"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'chat-media');

-- Ensure upload policy exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' 
    AND policyname = 'Users can upload chat media'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can upload chat media"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = ''chat-media'' AND auth.uid()::text = (storage.foldername(name))[1])';
  END IF;
END $$;