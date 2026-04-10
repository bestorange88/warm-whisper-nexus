CREATE POLICY "Creators can view own conversations"
ON public.conversations
FOR SELECT
TO authenticated
USING (auth.uid() = created_by);