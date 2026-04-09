-- Create a security definer function to check conversation membership
CREATE OR REPLACE FUNCTION public.is_conversation_member(_conversation_id uuid, _user_id uuid)
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
  )
$$;

-- Drop the recursive SELECT policy
DROP POLICY IF EXISTS "Members can view conversation members" ON public.conversation_members;

-- Create a non-recursive SELECT policy
CREATE POLICY "Members can view conversation members" ON public.conversation_members
FOR SELECT TO authenticated
USING (public.is_conversation_member(conversation_id, auth.uid()));