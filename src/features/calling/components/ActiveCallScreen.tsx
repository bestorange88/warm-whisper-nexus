import { useEffect, useState, useRef } from 'react';
import {
  useVideo,
  useHMSStore,
  selectCameraStreamByPeerID,
} from '@100mslive/react-sdk';
import { useCallContext } from '../CallProvider';
import { useHmsCall } from '../hooks/useHmsCall';
import { UserAvatar } from '@/components/avatar/UserAvatar';
import { formatDuration } from '../utils';
import {
  Mic, MicOff, Video, VideoOff, PhoneOff, Volume2,
  WifiOff, ShieldAlert, AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

function PeerVideo({ peerId, isLocal, mirror }: { peerId: string; isLocal?: boolean; mirror?: boolean }) {
  const trackId = useHMSStore(selectCameraStreamByPeerID(peerId))?.id;
  const { videoRef } = useVideo({ trackId });
  return (
    <video
      ref={videoRef}
      autoPlay
      muted={isLocal}
      playsInline
      className={cn(
        'h-full w-full object-cover',
        mirror && 'scale-x-[-1]'
      )}
    />
  );
}

function CallErrorBanner({ icon: Icon, message }: { icon: React.ElementType; message: string }) {
  return (
    <div className="absolute left-4 right-4 top-16 z-40 flex items-center gap-2 rounded-xl bg-red-500/90 px-4 py-3 text-white shadow-lg backdrop-blur-sm">
      <Icon className="h-5 w-5 shrink-0" />
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
}

export function ActiveCallScreen() {
  const { t } = useTranslation();
  const ctx = useCallContext();
  const {
    callState, activeCall, endReason, duration, error,
    cancelCall, endCall, onHmsConnected,
  } = ctx;

  const {
    join, leave, isConnected, isReconnecting,
    localPeer, remotePeers,
    isAudioEnabled, isVideoEnabled,
    toggleAudio, toggleVideo,
    roomState,
  } = useHmsCall();

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showReconnecting, setShowReconnecting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const connectedAtRef = useRef<number>();
  const hasJoinedRef = useRef(false);
  const joinAttemptRef = useRef(0);

  type ShowCallState = 'dialing' | 'connecting' | 'connected' | 'reconnecting' | 'ended' | 'failed';
  const showStates: ShowCallState[] = ['dialing', 'connecting', 'connected', 'reconnecting', 'ended', 'failed'];
  const shouldShow = showStates.includes(callState as ShowCallState);
  const state = callState as ShowCallState;

  useEffect(() => {
    if (!activeCall?.hmsToken || hasJoinedRef.current) return;
    if (callState !== 'connecting' && callState !== 'dialing') return;

    hasJoinedRef.current = true;
    joinAttemptRef.current += 1;
    const attempt = joinAttemptRef.current;
    const userName = activeCall.callerName || activeCall.calleeName || 'User';

    join(activeCall.hmsToken, userName).catch((err) => {
      console.error('Failed to join HMS room:', err);
      hasJoinedRef.current = false;

      const errMsg = err?.message || '';
      if (errMsg.includes('NotAllowedError') || errMsg.includes('Permission')) {
        toast.error(t('calling.permissionToast'));
      } else if (errMsg.includes('token') || errMsg.includes('Token') || errMsg.includes('401')) {
        toast.error(t('calling.tokenToast'));
      } else {
        toast.error(t('calling.connectFailToast'));
      }

      if (attempt <= 1 && activeCall.hmsToken) {
        setTimeout(() => {
          if (!hasJoinedRef.current && activeCall.hmsToken) {
            hasJoinedRef.current = true;
            join(activeCall.hmsToken, userName).catch(() => {
              hasJoinedRef.current = false;
            });
          }
        }, 2000);
      }
    });
  }, [callState, activeCall?.hmsToken, join, activeCall?.callerName, activeCall?.calleeName, t]);

  useEffect(() => {
    // Only notify connected when in 'connecting' (after callee accepted)
    // Not during 'dialing' — caller must wait for callee to accept
    if (isConnected && callState === 'connecting') {
      onHmsConnected?.();
    }
  }, [isConnected, callState, onHmsConnected]);

  useEffect(() => {
    if (isReconnecting && callState === 'connected') {
      setShowReconnecting(true);
      toast.warning(t('calling.reconnecting'));
    } else if (!isReconnecting && showReconnecting) {
      setShowReconnecting(false);
      if (isConnected) {
        toast.success(t('calling.reconnected'));
      }
    }
  }, [isReconnecting, callState, isConnected, showReconnecting, t]);

  useEffect(() => {
    if (roomState === 'Disconnected' && hasJoinedRef.current && callState === 'connected') {
      toast.error(t('calling.disconnected'));
      endCall();
    }
  }, [roomState, callState, endCall, t]);

  useEffect(() => {
    if ((callState === 'ended' || callState === 'failed') && hasJoinedRef.current) {
      leave();
      hasJoinedRef.current = false;
      joinAttemptRef.current = 0;
    }
  }, [callState, leave]);

  useEffect(() => {
    if (callState === 'connected') {
      connectedAtRef.current = Date.now();
      timerRef.current = setInterval(() => {
        if (connectedAtRef.current) {
          setElapsedSeconds(Math.floor((Date.now() - connectedAtRef.current) / 1000));
        }
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      if (callState !== 'reconnecting') {
        setElapsedSeconds(0);
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callState]);

  useEffect(() => {
    return () => {
      if (hasJoinedRef.current) {
        leave();
        hasJoinedRef.current = false;
      }
    };
  }, [leave]);

  if (!shouldShow || !activeCall) return null;

  const isVideo = activeCall.callType === 'video';
  const isCaller = !!activeCall.calleeName;
  const remoteName = isCaller ? activeCall.calleeName : activeCall.callerName;
  const remoteAvatar = isCaller ? activeCall.calleeAvatar : activeCall.callerAvatar;
  const remotePeer = remotePeers[0];

  const getStatusText = () => {
    switch (state) {
      case 'dialing': return t('calling.calling');
      case 'connecting': return t('calling.connecting');
      case 'connected': return formatDuration(elapsedSeconds);
      case 'reconnecting': return t('calling.reconnecting');
      case 'ended':
        switch (endReason) {
          case 'completed': return duration > 0 ? `${t('calling.callEnded')} ${formatDuration(duration)}` : t('calling.callEnded');
          case 'rejected': return t('calling.declined');
          case 'cancelled': return t('calling.cancelled');
          case 'missed': return t('calling.noAnswer');
          case 'permission_denied': return t('calling.permissionDenied');
          default: return t('calling.callEnded');
        }
      case 'failed': return error || t('calling.callFailed');
      default: return '';
    }
  };

  const handleHangup = () => {
    if (state === 'dialing') {
      cancelCall();
    } else {
      endCall();
    }
  };

  const isActive = ['dialing', 'connecting', 'connected', 'reconnecting'].includes(state);
  const isEnded = state === 'ended' || state === 'failed';

  const getErrorBanner = () => {
    if (showReconnecting) {
      return <CallErrorBanner icon={WifiOff} message={t('calling.reconnecting')} />;
    }
    if (state === 'failed' && error?.includes('权限')) {
      return <CallErrorBanner icon={ShieldAlert} message={t('calling.permissionBanner')} />;
    }
    if (state === 'failed') {
      return <CallErrorBanner icon={AlertTriangle} message={error || t('calling.callFailed')} />;
    }
    return null;
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gradient-to-b from-[#1a1a2e] to-[#16213e]">
      <div className="safe-area-top" />

      {getErrorBanner()}

      <div className="flex flex-1 flex-col items-center justify-center">
        {isVideo && callState === 'connected' && remotePeer ? (
          <div className="absolute inset-0">
            <PeerVideo peerId={remotePeer.id} />
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="relative mb-6">
              {callState === 'dialing' && (
                <div className="absolute -inset-4 animate-pulse rounded-full border-2 border-white/20" />
              )}
              {callState === 'connected' && (
                <div className="absolute -inset-4 rounded-full border-2 border-green-400/30" />
              )}
              {(callState === 'failed' || (callState === 'ended' && endReason === 'permission_denied')) && (
                <div className="absolute -inset-4 rounded-full border-2 border-red-400/30" />
              )}
              <UserAvatar src={remoteAvatar} name={remoteName} size="xl" />
            </div>
            <h2 className="mb-2 text-2xl font-semibold text-white">
              {remoteName || t('calling.unknownUser')}
            </h2>
            <p className={cn(
              'text-sm',
              state === 'connected' ? 'text-green-400' :
              isEnded ? 'text-red-400' : 'text-white/60'
            )}>
              {getStatusText()}
            </p>
          </div>
        )}

        {isVideo && callState === 'connected' && remotePeer && (
          <div className="absolute left-0 right-0 top-16 z-10 text-center">
            <h2 className="text-lg font-semibold text-white drop-shadow-lg">
              {remoteName || t('calling.unknownUser')}
            </h2>
            <p className="text-sm text-green-400 drop-shadow-lg">{getStatusText()}</p>
          </div>
        )}
      </div>

      {isVideo && callState === 'connected' && isVideoEnabled && localPeer && (
        <div className="absolute right-4 top-16 z-20 h-40 w-28 overflow-hidden rounded-xl bg-stone-800 shadow-lg">
          <PeerVideo peerId={localPeer.id} isLocal mirror />
        </div>
      )}

      {isActive && (
        <div className="safe-area-bottom relative z-30 pb-10">
          <div className="flex items-center justify-center gap-6">
            <button
              onClick={toggleAudio}
              className={cn(
                'flex h-14 w-14 items-center justify-center rounded-full transition-all',
                !isAudioEnabled ? 'bg-white text-stone-900' : 'bg-white/20 text-white'
              )}
            >
              {!isAudioEnabled ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
            </button>

            {isVideo && (
              <button
                onClick={toggleVideo}
                className={cn(
                  'flex h-14 w-14 items-center justify-center rounded-full transition-all',
                  !isVideoEnabled ? 'bg-white text-stone-900' : 'bg-white/20 text-white'
                )}
              >
                {!isVideoEnabled ? <VideoOff className="h-6 w-6" /> : <Video className="h-6 w-6" />}
              </button>
            )}

            <button className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 text-white">
              <Volume2 className="h-6 w-6" />
            </button>

            <button
              onClick={handleHangup}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500 text-white shadow-lg transition-transform active:scale-95"
            >
              <PhoneOff className="h-7 w-7" />
            </button>
          </div>
        </div>
      )}

      {isEnded && (
        <div className="safe-area-bottom pb-20">
          <p className="text-center text-sm text-white/40">{t('calling.closingSoon')}</p>
        </div>
      )}
    </div>
  );
}
