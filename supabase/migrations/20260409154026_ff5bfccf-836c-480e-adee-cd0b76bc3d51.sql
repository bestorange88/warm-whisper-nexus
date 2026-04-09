-- Allow members to leave group (delete own membership)
CREATE POLICY "Members can leave conversations"
ON public.conversation_members
FOR DELETE
USING (user_id = auth.uid());

-- Also allow group owner to remove members
-- First create a helper function to check if user is owner
CREATE OR REPLACE FUNCTION public.is_conversation_owner(_conversation_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.conversation_members
    WHERE conversation_id = _conversation_id
      AND user_id = _user_id
      AND role = 'owner'
  )
$$;

-- Allow owner to remove members
CREATE POLICY "Owners can remove members"
ON public.conversation_members
FOR DELETE
USING (public.is_conversation_owner(conversation_id, auth.uid()));