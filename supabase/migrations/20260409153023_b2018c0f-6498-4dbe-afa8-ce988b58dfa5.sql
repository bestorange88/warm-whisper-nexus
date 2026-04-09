-- Create call_sessions table
CREATE TABLE public.call_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id),
  caller_id UUID NOT NULL REFERENCES public.profiles(id),
  callee_id UUID NOT NULL REFERENCES public.profiles(id),
  call_type TEXT NOT NULL CHECK (call_type IN ('audio', 'video')),
  status TEXT NOT NULL DEFAULT 'initiated' CHECK (status IN ('initiated', 'ringing', 'accepted', 'rejected', 'cancelled', 'missed', 'ended', 'failed')),
  hms_room_id TEXT,
  started_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER DEFAULT 0,
  ended_by UUID REFERENCES public.profiles(id),
  end_reason TEXT CHECK (end_reason IS NULL OR end_reason IN ('completed', 'rejected', 'cancelled', 'missed', 'failed', 'permission_denied')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.call_sessions ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own call sessions"
ON public.call_sessions
FOR SELECT
USING (auth.uid() = caller_id OR auth.uid() = callee_id);

CREATE POLICY "Authenticated users can create call sessions"
ON public.call_sessions
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Participants can update call sessions"
ON public.call_sessions
FOR UPDATE
USING (auth.uid() = caller_id OR auth.uid() = callee_id);

-- Updated_at trigger
CREATE TRIGGER update_call_sessions_updated_at
BEFORE UPDATE ON public.call_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX idx_call_sessions_conversation ON public.call_sessions(conversation_id);
CREATE INDEX idx_call_sessions_callee_status ON public.call_sessions(callee_id, status);
CREATE INDEX idx_call_sessions_caller_status ON public.call_sessions(caller_id, status);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.call_sessions;
