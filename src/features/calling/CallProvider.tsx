import { createContext, useContext, useReducer, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { callReducer, initialCallState, type CallMachineState } from './callStateMachine';
import { createCallSession, joinCallSession, endCallSession, requestMediaPermissions } from './callService';
import { callSounds } from './callSounds';
import type { CallType, CallAction, CallSession } from './types';
import { useQueryClient } from '@tanstack/react-query';

interface CallContextValue extends CallMachineState {
  initiateCall: (conversationId: string, calleeId: string, callType: CallType, calleeName?: string, calleeAvatar?: string) => void;
  acceptCall: () => void;
  rejectCall: () => void;
  cancelCall: () => void;
  endCall: () => void;
  resetCall: () => void;
  onHmsConnected: () => void;
}

const CallContext = createContext<CallContextValue | null>(null);

export function useCallContext() {
  const ctx = useContext(CallContext);
  if (!ctx) throw new Error('useCallContext must be used within CallProvider');
  return ctx;
}

const DIAL_TIMEOUT_MS = 60_000;

export function CallProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [state, dispatch] = useReducer(callReducer, initialCallState);
  const dialTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const stateRef = useRef(state);
  stateRef.current = state;

  // Listen for incoming calls via Realtime
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('incoming-calls')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'call_sessions',
          filter: `callee_id=eq.${user.id}`,
        },
        async (payload) => {
          const session = payload.new as CallSession;
          if (!session) return;

          if (payload.eventType === 'INSERT' && session.status === 'ringing') {
            if (stateRef.current.callState !== 'idle') return;

            const { data: callerProfile } = await supabase
              .from('public_profiles' as any)
              .select('display_name, avatar_url, username')
              .eq('id', session.caller_id)
              .single();

            dispatch({
              type: 'INCOMING_CALL',
              payload: {
                callSessionId: session.id,
                conversationId: session.conversation_id,
                callType: session.call_type,
                callerId: session.caller_id,
                calleeId: session.callee_id,
                hmsRoomId: session.hms_room_id,
                hmsToken: null,
                callerName: (callerProfile as any)?.display_name || (callerProfile as any)?.username || '未知用户',
                callerAvatar: (callerProfile as any)?.avatar_url || undefined,
              },
            });
          }

          if (payload.eventType === 'UPDATE') {
            if (session.status === 'cancelled' && stateRef.current.callState === 'incoming') {
              dispatch({ type: 'REMOTE_CANCELLED' });
            }
            if (['ended', 'failed'].includes(session.status) && ['connecting', 'connected'].includes(stateRef.current.callState)) {
              dispatch({
                type: 'CALL_ENDED',
                payload: {
                  reason: (session.end_reason as any) || 'completed',
                  duration: session.duration_seconds,
                },
              });
            }
          }
        }
      )
      .subscribe();

    const callerChannel = supabase
      .channel('caller-events')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'call_sessions',
          filter: `caller_id=eq.${user.id}`,
        },
        (payload) => {
          const session = payload.new as CallSession;
          if (!session || !stateRef.current.activeCall) return;
          if (session.id !== stateRef.current.activeCall.callSessionId) return;

          if (session.status === 'accepted' && stateRef.current.callState === 'dialing') {
            dispatch({ type: 'REMOTE_ACCEPTED' });
          }
          if (session.status === 'rejected' && stateRef.current.callState === 'dialing') {
            dispatch({ type: 'REMOTE_REJECTED' });
          }
          if (['ended', 'failed'].includes(session.status) && ['connecting', 'connected'].includes(stateRef.current.callState)) {
            dispatch({
              type: 'CALL_ENDED',
              payload: {
                reason: (session.end_reason as any) || 'completed',
                duration: session.duration_seconds,
              },
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(callerChannel);
    };
  }, [user]);

  // Dial timeout
  useEffect(() => {
    if (state.callState === 'dialing') {
      dialTimeoutRef.current = setTimeout(() => {
        if (stateRef.current.callState === 'dialing' && stateRef.current.activeCall) {
          endCallSession(stateRef.current.activeCall.callSessionId, 'missed').catch(console.error);
          dispatch({ type: 'TIMEOUT' });
        }
      }, DIAL_TIMEOUT_MS);
    } else {
      if (dialTimeoutRef.current) clearTimeout(dialTimeoutRef.current);
    }
    return () => {
      if (dialTimeoutRef.current) clearTimeout(dialTimeoutRef.current);
    };
  }, [state.callState]);

  // Auto-reset after ended/failed
  useEffect(() => {
    if (state.callState === 'ended' || state.callState === 'failed') {
      const timer = setTimeout(() => {
        dispatch({ type: 'RESET' });
        queryClient.invalidateQueries({ queryKey: ['messages'] });
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [state.callState, queryClient]);

  const initiateCall = useCallback(async (
    conversationId: string, calleeId: string, callType: CallType,
    calleeName?: string, calleeAvatar?: string
  ) => {
    if (stateRef.current.callState !== 'idle') return;

    dispatch({
      type: 'INITIATE_CALL',
      payload: { callType, conversationId, calleeId, calleeName, calleeAvatar },
    });

    const granted = await requestMediaPermissions(callType);
    if (!granted) {
      dispatch({ type: 'PERMISSION_DENIED' });
      return;
    }
    dispatch({ type: 'PERMISSION_GRANTED' });

    try {
      const result = await createCallSession({
        conversation_id: conversationId,
        callee_id: calleeId,
        call_type: callType,
      });
      dispatch({
        type: 'SESSION_CREATED',
        payload: {
          callSessionId: result.call_session_id,
          hmsRoomId: result.hms_room_id,
          hmsToken: result.token,
        },
      });
    } catch (err: any) {
      dispatch({ type: 'SESSION_FAILED', payload: { error: err.message || '创建通话失败' } });
    }
  }, []);

  const acceptCall = useCallback(async () => {
    if (stateRef.current.callState !== 'incoming' || !stateRef.current.activeCall) return;

    const { callSessionId, callType } = stateRef.current.activeCall;

    const granted = await requestMediaPermissions(callType);
    if (!granted) {
      await endCallSession(callSessionId, 'permission_denied').catch(console.error);
      dispatch({ type: 'PERMISSION_DENIED' });
      return;
    }

    dispatch({ type: 'ACCEPT_CALL' });

    try {
      const result = await joinCallSession(callSessionId);
      dispatch({
        type: 'CALL_ACCEPTED',
        payload: { hmsRoomId: result.hms_room_id, hmsToken: result.token },
      });
    } catch (err: any) {
      dispatch({ type: 'SESSION_FAILED', payload: { error: err.message || '加入通话失败' } });
    }
  }, []);

  const rejectCall = useCallback(async () => {
    if (!stateRef.current.activeCall) return;
    await endCallSession(stateRef.current.activeCall.callSessionId, 'rejected').catch(console.error);
    dispatch({ type: 'REJECT_CALL' });
  }, []);

  const cancelCall = useCallback(async () => {
    if (!stateRef.current.activeCall) return;
    await endCallSession(stateRef.current.activeCall.callSessionId, 'cancelled').catch(console.error);
    dispatch({ type: 'CANCEL_CALL' });
  }, []);

  const endCall = useCallback(async () => {
    if (!stateRef.current.activeCall) return;
    await endCallSession(stateRef.current.activeCall.callSessionId, 'completed').catch(console.error);
    dispatch({ type: 'END_CALL', payload: { reason: 'completed' } });
  }, []);

  const resetCall = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  /** Called by ActiveCallScreen when 100ms room is connected */
  const onHmsConnected = useCallback(() => {
    if (stateRef.current.callState === 'connecting' || stateRef.current.callState === 'dialing') {
      dispatch({ type: 'CONNECTED' });
    }
  }, []);

  return (
    <CallContext.Provider value={{
      ...state,
      initiateCall,
      acceptCall,
      rejectCall,
      cancelCall,
      endCall,
      resetCall,
      onHmsConnected,
    }}>
      {children}
    </CallContext.Provider>
  );
}
