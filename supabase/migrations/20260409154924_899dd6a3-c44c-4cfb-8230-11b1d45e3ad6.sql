-- Create chat-media storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-media', 'chat-media', true);

-- Anyone can view files (public bucket)
CREATE POLICY "Chat media is publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'chat-media');

-- Authenticated users can upload
CREATE POLICY "Authenticated users can upload chat media"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'chat-media' AND auth.uid() IS NOT NULL);

-- Users can delete their own uploads
CREATE POLICY "Users can delete own chat media"
ON storage.objects FOR DELETE
USING (bucket_id = 'chat-media' AND auth.uid()::text = (storage.foldername(name))[1]);