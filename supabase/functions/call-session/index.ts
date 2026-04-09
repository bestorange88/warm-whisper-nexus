import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const HMS_ACCESS_KEY = Deno.env.get('HMS_ACCESS_KEY')!;
const HMS_APP_SECRET = Deno.env.get('HMS_APP_SECRET')!;

function base64url(input: Uint8Array): string {
  const str = btoa(String.fromCharCode(...input));
  return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlStr(str: string): string {
  return base64url(new TextEncoder().encode(str));
}

async function signJWT(payload: Record<string, unknown>, secret: string): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };
  const headerB64 = base64urlStr(JSON.stringify(header));
  const payloadB64 = base64urlStr(JSON.stringify(payload));
  const data = `${headerB64}.${payloadB64}`;

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return `${data}.${base64url(new Uint8Array(sig))}`;
}

async function generateManagementToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  return signJWT({
    access_key: HMS_ACCESS_KEY,
    type: 'management',
    version: 2,
    iat: now,
    nbf: now,
    exp: now + 86400,
    jti: crypto.randomUUID(),
  }, HMS_APP_SECRET);
}

async function generateAuthToken(roomId: string, userId: string, role: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  return signJWT({
    access_key: HMS_ACCESS_KEY,
    room_id: roomId,
    user_id: userId,
    role: role,
    type: 'app',
    version: 2,
    iat: now,
    nbf: now,
    exp: now + 86400,
    jti: crypto.randomUUID(),
  }, HMS_APP_SECRET);
}

async function createHmsRoom(roomName: string, managementToken: string): Promise<string> {
  const res = await fetch('https://api.100ms.live/v2/rooms', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${managementToken}`,
    },
    body: JSON.stringify({
      name: roomName,
      description: 'Archimi Chat 1-on-1 call',
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to create 100ms room: ${res.status} ${err}`);
  }
  const data = await res.json();
  return data.id;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Create anon client to verify user token
    const supabaseAnon = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user: authUser }, error: authError } = await supabaseAnon.auth.getUser(token);
    if (authError || !authUser) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userId = authUser.id;

    // Service role client for DB operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    const action = url.pathname.split('/').pop();

    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();

    if (action === 'create') {
      const { conversation_id, callee_id, call_type } = body;

      if (!conversation_id || !callee_id || !call_type) {
        return new Response(JSON.stringify({ error: 'Missing required fields' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (!['audio', 'video'].includes(call_type)) {
        return new Response(JSON.stringify({ error: 'Invalid call_type' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Verify caller is member of conversation
      const { data: membership } = await supabase
        .from('conversation_members')
        .select('id')
        .eq('conversation_id', conversation_id)
        .eq('user_id', userId)
        .single();

      if (!membership) {
        return new Response(JSON.stringify({ error: 'Not a member of this conversation' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Verify callee is member of conversation
      const { data: calleeMembership } = await supabase
        .from('conversation_members')
        .select('id')
        .eq('conversation_id', conversation_id)
        .eq('user_id', callee_id)
        .single();

      if (!calleeMembership) {
        return new Response(JSON.stringify({ error: 'Callee is not a member of this conversation' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Check no active call in this conversation
      const { data: activeCalls } = await supabase
        .from('call_sessions')
        .select('id')
        .eq('conversation_id', conversation_id)
        .in('status', ['initiated', 'ringing', 'accepted'])
        .limit(1);

      if (activeCalls && activeCalls.length > 0) {
        return new Response(JSON.stringify({ error: 'There is already an active call in this conversation' }), {
          status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Create call session
      const { data: callSession, error: insertError } = await supabase
        .from('call_sessions')
        .insert({
          conversation_id,
          caller_id: userId,
          callee_id,
          call_type,
          status: 'ringing',
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) {
        throw new Error(`Failed to create call session: ${insertError.message}`);
      }

      // Create 100ms room
      const roomName = `call_${conversation_id}_${callSession.id}`.substring(0, 100);
      const mgmtToken = await generateManagementToken();
      const hmsRoomId = await createHmsRoom(roomName, mgmtToken);

      // Update call session with room id
      await supabase
        .from('call_sessions')
        .update({ hms_room_id: hmsRoomId })
        .eq('id', callSession.id);

      // Generate auth token for caller
      const callerToken = await generateAuthToken(hmsRoomId, userId, 'host');

      return new Response(JSON.stringify({
        call_session_id: callSession.id,
        hms_room_id: hmsRoomId,
        token: callerToken,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (action === 'join') {
      const { call_session_id } = body;

      if (!call_session_id) {
        return new Response(JSON.stringify({ error: 'Missing call_session_id' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: callSession } = await supabase
        .from('call_sessions')
        .select('*')
        .eq('id', call_session_id)
        .single();

      if (!callSession) {
        return new Response(JSON.stringify({ error: 'Call session not found' }), {
          status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (callSession.callee_id !== userId) {
        return new Response(JSON.stringify({ error: 'Not authorized to join this call' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (callSession.status !== 'ringing') {
        return new Response(JSON.stringify({ error: `Cannot join call in ${callSession.status} state` }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      await supabase
        .from('call_sessions')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString(),
        })
        .eq('id', call_session_id);

      const calleeToken = await generateAuthToken(callSession.hms_room_id!, userId, 'guest');

      return new Response(JSON.stringify({
        hms_room_id: callSession.hms_room_id,
        token: calleeToken,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (action === 'end') {
      const { call_session_id, reason } = body;

      if (!call_session_id) {
        return new Response(JSON.stringify({ error: 'Missing call_session_id' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: callSession } = await supabase
        .from('call_sessions')
        .select('*')
        .eq('id', call_session_id)
        .single();

      if (!callSession) {
        return new Response(JSON.stringify({ error: 'Call session not found' }), {
          status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (callSession.caller_id !== userId && callSession.callee_id !== userId) {
        return new Response(JSON.stringify({ error: 'Not a participant of this call' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (['ended', 'failed', 'rejected', 'cancelled', 'missed'].includes(callSession.status)) {
        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const endReason = reason || 'completed';
      const now = new Date().toISOString();
      let durationSeconds = 0;
      let newStatus = 'ended';

      if (endReason === 'rejected') newStatus = 'rejected';
      else if (endReason === 'cancelled') newStatus = 'cancelled';
      else if (endReason === 'missed') newStatus = 'missed';
      else if (endReason === 'failed') newStatus = 'failed';

      if (callSession.accepted_at && endReason === 'completed') {
        durationSeconds = Math.floor(
          (new Date(now).getTime() - new Date(callSession.accepted_at).getTime()) / 1000
        );
      }

      await supabase
        .from('call_sessions')
        .update({
          status: newStatus,
          ended_at: now,
          ended_by: userId,
          end_reason: endReason,
          duration_seconds: durationSeconds,
        })
        .eq('id', call_session_id);

      // Insert system message into chat
      const callTypeLabel = callSession.call_type === 'audio' ? '语音通话' : '视频通话';
      let messageContent: string;

      if (endReason === 'completed' && durationSeconds > 0) {
        const mins = Math.floor(durationSeconds / 60).toString().padStart(2, '0');
        const secs = (durationSeconds % 60).toString().padStart(2, '0');
        messageContent = `[${callTypeLabel}] 通话时长 ${mins}:${secs}`;
      } else if (endReason === 'rejected') {
        messageContent = `[${callTypeLabel}] 已拒绝`;
      } else if (endReason === 'cancelled') {
        messageContent = `[${callTypeLabel}] 已取消`;
      } else if (endReason === 'missed') {
        messageContent = `[${callTypeLabel}] 未接听`;
      } else {
        messageContent = `[${callTypeLabel}] 通话已结束`;
      }

      await supabase.from('messages').insert({
        conversation_id: callSession.conversation_id,
        sender_id: callSession.caller_id,
        type: 'system',
        content: messageContent,
      });

      await supabase
        .from('conversations')
        .update({ updated_at: now })
        .eq('id', callSession.conversation_id);

      return new Response(JSON.stringify({ ok: true, duration_seconds: durationSeconds }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else {
      return new Response(JSON.stringify({ error: 'Unknown action' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (err) {
    console.error('Call session error:', err);
    return new Response(JSON.stringify({ error: (err as Error).message || 'Internal error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
