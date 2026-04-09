-- 1. Fix profiles SELECT: restrict to authenticated users only
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by authenticated users"
ON public.profiles FOR SELECT TO authenticated
USING (true);

-- 2. Fix conversation_members INSERT: only owner can add others, or user adds self
DROP POLICY IF EXISTS "Users can insert conversation members" ON public.conversation_members;
CREATE POLICY "Users can insert conversation members"
ON public.conversation_members FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  OR public.is_conversation_owner(conversation_id, auth.uid())
);

-- 3. Fix call_sessions INSERT: caller must be the authenticated user
DROP POLICY IF EXISTS "Authenticated users can create call sessions" ON public.call_sessions;
CREATE POLICY "Users can create own call sessions"
ON public.call_sessions FOR INSERT TO authenticated
WITH CHECK (auth.uid() = caller_id);

-- 4. Fix friendships DELETE: allow deleting either side
DROP POLICY IF EXISTS "Users can delete friendships" ON public.friendships;
CREATE POLICY "Users can delete friendships"
ON public.friendships FOR DELETE TO authenticated
USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- 5. Fix chat-media storage upload: enforce user folder path
DROP POLICY IF EXISTS "Authenticated users can upload chat media" ON storage.objects;
CREATE POLICY "Users can upload to own folder in chat-media"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'chat-media'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 6. Tighten security definer functions: revoke from public, grant to authenticated
REVOKE EXECUTE ON FUNCTION public.is_conversation_member FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_conversation_member TO authenticated;

REVOKE EXECUTE ON FUNCTION public.is_conversation_owner FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_conversation_owner TO authenticated;