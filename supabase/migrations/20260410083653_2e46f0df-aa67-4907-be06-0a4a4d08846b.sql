-- Create table for E2EE public keys
CREATE TABLE public.user_encryption_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  public_key TEXT NOT NULL,
  device_id TEXT NOT NULL DEFAULT 'default',
  key_type TEXT NOT NULL DEFAULT 'x25519',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, device_id)
);

-- Enable RLS
ALTER TABLE public.user_encryption_keys ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read public keys (needed to encrypt)
CREATE POLICY "Authenticated users can view public keys"
ON public.user_encryption_keys
FOR SELECT
TO authenticated
USING (true);

-- Users can insert own keys
CREATE POLICY "Users can insert own keys"
ON public.user_encryption_keys
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update own keys
CREATE POLICY "Users can update own keys"
ON public.user_encryption_keys
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Users can delete own keys
CREATE POLICY "Users can delete own keys"
ON public.user_encryption_keys
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_user_encryption_keys_updated_at
BEFORE UPDATE ON public.user_encryption_keys
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for public key changes
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_encryption_keys;