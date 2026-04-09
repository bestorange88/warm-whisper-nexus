ALTER TABLE public.conversation_members
ADD COLUMN is_pinned boolean NOT NULL DEFAULT false;