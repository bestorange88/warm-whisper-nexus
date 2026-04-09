import type { CallState, CallAction, ActiveCallData, CallEndReason } from './types';

export interface CallMachineState {
  callState: CallState;
  activeCall: ActiveCallData | null;
  endReason: CallEndReason | null;
  duration: number;
  error: string | null;
}

export const initialCallState: CallMachineState = {
  callState: 'idle',
  activeCall: null,
  endReason: null,
  duration: 0,
  error: null,
};

export function callReducer(state: CallMachineState, action: CallAction): CallMachineState {
  switch (action.type) {
    case 'INITIATE_CALL':
      return {
        ...state,
        callState: 'requesting_permissions',
        activeCall: {
          callSessionId: '',
          conversationId: action.payload.conversationId,
          callType: action.payload.callType,
          callerId: '',
          calleeId: action.payload.calleeId,
          hmsRoomId: null,
          hmsToken: null,
          calleeName: action.payload.calleeName,
          calleeAvatar: action.payload.calleeAvatar,
        },
        endReason: null,
        duration: 0,
        error: null,
      };

    case 'PERMISSION_GRANTED':
      return { ...state, callState: 'creating_session' };

    case 'PERMISSION_DENIED':
      return { ...state, callState: 'failed', error: '权限被拒绝', endReason: 'permission_denied' };

    case 'SESSION_CREATED':
      return {
        ...state,
        callState: 'dialing',
        activeCall: state.activeCall ? {
          ...state.activeCall,
          callSessionId: action.payload.callSessionId,
          hmsRoomId: action.payload.hmsRoomId,
          hmsToken: action.payload.hmsToken,
        } : null,
      };

    case 'SESSION_FAILED':
      return { ...state, callState: 'failed', error: action.payload.error };

    case 'INCOMING_CALL':
      if (state.callState !== 'idle') return state;
      return {
        ...state,
        callState: 'incoming',
        activeCall: action.payload,
        endReason: null,
        duration: 0,
        error: null,
      };

    case 'ACCEPT_CALL':
      return { ...state, callState: 'connecting' };

    case 'CALL_ACCEPTED':
      return {
        ...state,
        callState: 'connecting',
        activeCall: state.activeCall ? {
          ...state.activeCall,
          hmsRoomId: action.payload.hmsRoomId,
          hmsToken: action.payload.hmsToken,
        } : null,
      };

    case 'REMOTE_ACCEPTED':
      return { ...state, callState: 'connecting' };

    case 'REMOTE_REJECTED':
      return { ...state, callState: 'ended', endReason: 'rejected' };

    case 'REMOTE_CANCELLED':
      return { ...state, callState: 'ended', endReason: 'cancelled' };

    case 'REJECT_CALL':
      return { ...state, callState: 'ended', endReason: 'rejected' };

    case 'CANCEL_CALL':
      return { ...state, callState: 'ended', endReason: 'cancelled' };

    case 'CONNECTED':
      return { ...state, callState: 'connected' };

    case 'RECONNECTING':
      return { ...state, callState: 'reconnecting' };

    case 'RECONNECTED':
      return { ...state, callState: 'connected' };

    case 'DISCONNECTED':
    case 'END_CALL':
      return {
        ...state,
        callState: 'ended',
        endReason: action.type === 'END_CALL' ? action.payload?.reason || 'completed' : 'completed',
      };

    case 'CALL_ENDED':
      return {
        ...state,
        callState: 'ended',
        endReason: action.payload.reason,
        duration: action.payload.duration || 0,
      };

    case 'TIMEOUT':
      return { ...state, callState: 'ended', endReason: 'missed' };

    case 'RESET':
      return initialCallState;

    default:
      return state;
  }
}
