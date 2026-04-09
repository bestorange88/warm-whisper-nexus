import { supabase } from '@/integrations/supabase/client';

const FUNCTION_NAME = 'call-session';

export async function createCallSession(params: {
  conversation_id: string;
  callee_id: string;
  call_type: 'audio' | 'video';
}): Promise<{ call_session_id: string; hms_room_id: string; token: string }> {
  const { data, error } = await supabase.functions.invoke(`${FUNCTION_NAME}/create`, {
    body: params,
  });
  if (error) throw new Error(error.message || 'Failed to create call session');
  if (data?.error) throw new Error(data.error);
  return data;
}

export async function joinCallSession(callSessionId: string): Promise<{ hms_room_id: string; token: string }> {
  const { data, error } = await supabase.functions.invoke(`${FUNCTION_NAME}/join`, {
    body: { call_session_id: callSessionId },
  });
  if (error) throw new Error(error.message || 'Failed to join call session');
  if (data?.error) throw new Error(data.error);
  return data;
}

export async function endCallSession(callSessionId: string, reason: string): Promise<void> {
  const { data, error } = await supabase.functions.invoke(`${FUNCTION_NAME}/end`, {
    body: { call_session_id: callSessionId, reason },
  });
  if (error) throw new Error(error.message || 'Failed to end call session');
  if (data?.error) throw new Error(data.error);
}

export async function requestMediaPermissions(callType: 'audio' | 'video'): Promise<boolean> {
  try {
    const constraints = callType === 'video'
      ? { audio: true, video: true }
      : { audio: true };
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    stream.getTracks().forEach(track => track.stop());
    return true;
  } catch {
    return false;
  }
}
