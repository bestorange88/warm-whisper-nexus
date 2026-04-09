/** Call session status */
export type CallSessionStatus =
  | 'initiated'
  | 'ringing'
  | 'accepted'
  | 'rejected'
  | 'cancelled'
  | 'missed'
  | 'ended'
  | 'failed';

/** Call type */
export type CallType = 'audio' | 'video';

/** UI-level call state machine */
export type CallState =
  | 'idle'
  | 'requesting_permissions'
  | 'creating_session'
  | 'dialing'
  | 'incoming'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'ended'
  | 'failed';

/** Reason for ending a call */
export type CallEndReason =
  | 'completed'
  | 'rejected'
  | 'cancelled'
  | 'missed'
  | 'failed'
  | 'permission_denied';

/** Call session from database */
export interface CallSession {
  id: string;
  conversation_id: string;
  caller_id: string;
  callee_id: string;
  call_type: CallType;
  status: CallSessionStatus;
  hms_room_id: string | null;
  started_at: string | null;
  accepted_at: string | null;
  ended_at: string | null;
  duration_seconds: number;
  ended_by: string | null;
  end_reason: string | null;
  created_at: string;
  updated_at: string;
}

/** Active call context data */
export interface ActiveCallData {
  callSessionId: string;
  conversationId: string;
  callType: CallType;
  callerId: string;
  calleeId: string;
  hmsRoomId: string | null;
  hmsToken: string | null;
  callerName?: string;
  callerAvatar?: string;
  calleeName?: string;
  calleeAvatar?: string;
}

/** Call state machine action */
export type CallAction =
  | { type: 'INITIATE_CALL'; payload: { callType: CallType; conversationId: string; calleeId: string; calleeName?: string; calleeAvatar?: string } }
  | { type: 'PERMISSION_GRANTED' }
  | { type: 'PERMISSION_DENIED' }
  | { type: 'SESSION_CREATED'; payload: { callSessionId: string; hmsRoomId: string; hmsToken: string } }
  | { type: 'SESSION_FAILED'; payload: { error: string } }
  | { type: 'INCOMING_CALL'; payload: ActiveCallData }
  | { type: 'ACCEPT_CALL' }
  | { type: 'CALL_ACCEPTED'; payload: { hmsRoomId: string; hmsToken: string } }
  | { type: 'REJECT_CALL' }
  | { type: 'CANCEL_CALL' }
  | { type: 'REMOTE_ACCEPTED' }
  | { type: 'REMOTE_REJECTED' }
  | { type: 'REMOTE_CANCELLED' }
  | { type: 'CONNECTED' }
  | { type: 'DISCONNECTED' }
  | { type: 'RECONNECTING' }
  | { type: 'RECONNECTED' }
  | { type: 'END_CALL'; payload?: { reason: CallEndReason } }
  | { type: 'CALL_ENDED'; payload: { reason: CallEndReason; duration?: number } }
  | { type: 'RESET' }
  | { type: 'TIMEOUT' };
