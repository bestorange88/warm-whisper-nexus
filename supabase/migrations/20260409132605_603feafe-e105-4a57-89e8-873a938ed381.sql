-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  username TEXT NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT DEFAULT '',
  phone TEXT,
  status TEXT DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'busy', 'away')),
  last_seen TIMESTAMPTZ DEFAULT now(),
  language TEXT DEFAULT 'zh-CN',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Conversations
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('direct', 'group')),
  name TEXT,
  avatar_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON public.conversations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Conversation members
CREATE TABLE public.conversation_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT now(),
  last_read_at TIMESTAMPTZ DEFAULT now(),
  is_muted BOOLEAN DEFAULT false,
  muted_until TIMESTAMPTZ,
  UNIQUE (conversation_id, user_id)
);

ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;

-- Conversations RLS
CREATE POLICY "Users can view their conversations" ON public.conversations FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.conversation_members WHERE conversation_id = id AND user_id = auth.uid()));
CREATE POLICY "Users can create conversations" ON public.conversations FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update their conversations" ON public.conversations FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.conversation_members WHERE conversation_id = id AND user_id = auth.uid()));

-- Conversation members RLS
CREATE POLICY "Members can view conversation members" ON public.conversation_members FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.conversation_members cm WHERE cm.conversation_id = conversation_members.conversation_id AND cm.user_id = auth.uid()));
CREATE POLICY "Users can insert conversation members" ON public.conversation_members FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own membership" ON public.conversation_members FOR UPDATE USING (user_id = auth.uid());

-- Messages
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id),
  type TEXT DEFAULT 'text' CHECK (type IN ('text', 'image', 'file', 'audio', 'video', 'system')),
  content TEXT,
  media_url TEXT,
  file_name TEXT,
  file_size BIGINT,
  reply_to UUID REFERENCES public.messages(id),
  is_edited BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view messages" ON public.messages FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.conversation_members WHERE conversation_id = messages.conversation_id AND user_id = auth.uid()));
CREATE POLICY "Members can send messages" ON public.messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id AND EXISTS (SELECT 1 FROM public.conversation_members WHERE conversation_id = messages.conversation_id AND user_id = auth.uid()));
CREATE POLICY "Senders can update own messages" ON public.messages FOR UPDATE USING (auth.uid() = sender_id);

CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON public.messages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Friendships
CREATE TABLE public.friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, friend_id)
);

ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own friendships" ON public.friendships FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create friendships" ON public.friendships FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() = friend_id);
CREATE POLICY "Users can delete friendships" ON public.friendships FOR DELETE USING (auth.uid() = user_id);

-- Friend requests
CREATE TABLE public.friend_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own friend requests" ON public.friend_requests FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can send friend requests" ON public.friend_requests FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Receiver can update friend requests" ON public.friend_requests FOR UPDATE USING (auth.uid() = receiver_id);

CREATE TRIGGER update_friend_requests_updated_at BEFORE UPDATE ON public.friend_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Blocks
CREATE TABLE public.blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (blocker_id, blocked_id)
);

ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own blocks" ON public.blocks FOR SELECT USING (auth.uid() = blocker_id);
CREATE POLICY "Users can create blocks" ON public.blocks FOR INSERT WITH CHECK (auth.uid() = blocker_id);
CREATE POLICY "Users can delete blocks" ON public.blocks FOR DELETE USING (auth.uid() = blocker_id);

-- Report reasons
CREATE TABLE public.report_reasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  label_zh TEXT NOT NULL,
  label_en TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0
);

ALTER TABLE public.report_reasons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view report reasons" ON public.report_reasons FOR SELECT USING (true);

-- Reports
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES auth.users(id),
  reported_user_id UUID REFERENCES auth.users(id),
  reported_message_id UUID REFERENCES public.messages(id),
  type TEXT NOT NULL CHECK (type IN ('user', 'message')),
  reason_id UUID REFERENCES public.report_reasons(id),
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
  admin_notes TEXT,
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can create reports" ON public.reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Users can view own reports" ON public.reports FOR SELECT USING (auth.uid() = reporter_id);

CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON public.reports FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Account deletion requests
CREATE TABLE public.account_deletion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'cancelled', 'completed')),
  requested_at TIMESTAMPTZ DEFAULT now(),
  cooling_ends_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '7 days'),
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ
);

ALTER TABLE public.account_deletion_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own deletion requests" ON public.account_deletion_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create deletion requests" ON public.account_deletion_requests FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Seed report reasons
INSERT INTO public.report_reasons (key, label_zh, label_en, sort_order) VALUES
  ('spam', '垃圾信息', 'Spam', 1),
  ('harassment', '骚扰', 'Harassment', 2),
  ('hate_speech', '仇恨言论', 'Hate Speech', 3),
  ('violence', '暴力内容', 'Violence', 4),
  ('inappropriate', '不当内容', 'Inappropriate Content', 5),
  ('fraud', '欺诈', 'Fraud', 6),
  ('impersonation', '冒充他人', 'Impersonation', 7),
  ('other', '其他', 'Other', 8);