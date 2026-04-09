-- Fix conversations SELECT policy (wrong reference: conversation_members.id should be conversations.id)
DROP POLICY IF EXISTS "Users can view their conversations" ON public.conversations;
CREATE POLICY "Users can view their conversations"
ON public.conversations
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.conversation_members
  WHERE conversation_members.conversation_id = conversations.id
    AND conversation_members.user_id = auth.uid()
));

-- Fix conversations UPDATE policy (same bug)
DROP POLICY IF EXISTS "Users can update their conversations" ON public.conversations;
CREATE POLICY "Users can update their conversations"
ON public.conversations
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.conversation_members
  WHERE conversation_members.conversation_id = conversations.id
    AND conversation_members.user_id = auth.uid()
));

-- Add foreign key for messages.sender_id -> profiles.id (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'messages_sender_id_fkey'
  ) THEN
    ALTER TABLE public.messages
      ADD CONSTRAINT messages_sender_id_fkey
      FOREIGN KEY (sender_id) REFERENCES public.profiles(id);
  END IF;
END $$;

-- Add foreign key for conversation_members.user_id -> profiles.id (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'conversation_members_user_id_fkey'
  ) THEN
    ALTER TABLE public.conversation_members
      ADD CONSTRAINT conversation_members_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES public.profiles(id);
  END IF;
END $$;

-- Add foreign key for friendships
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'friendships_friend_id_fkey'
  ) THEN
    ALTER TABLE public.friendships
      ADD CONSTRAINT friendships_friend_id_fkey
      FOREIGN KEY (friend_id) REFERENCES public.profiles(id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'friendships_user_id_fkey'
  ) THEN
    ALTER TABLE public.friendships
      ADD CONSTRAINT friendships_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES public.profiles(id);
  END IF;
END $$;

-- Add foreign key for friend_requests
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'friend_requests_sender_id_fkey'
  ) THEN
    ALTER TABLE public.friend_requests
      ADD CONSTRAINT friend_requests_sender_id_fkey
      FOREIGN KEY (sender_id) REFERENCES public.profiles(id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'friend_requests_receiver_id_fkey'
  ) THEN
    ALTER TABLE public.friend_requests
      ADD CONSTRAINT friend_requests_receiver_id_fkey
      FOREIGN KEY (receiver_id) REFERENCES public.profiles(id);
  END IF;
END $$;

-- Enable realtime for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
