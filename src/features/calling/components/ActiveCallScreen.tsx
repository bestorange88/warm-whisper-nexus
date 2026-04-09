import { useEffect, useState, useRef } from 'react';
import { useCallContext } from '../CallProvider';
import { UserAvatar } from '@/components/avatar/UserAvatar';
import { formatDuration } from '../utils';
import {
  Mic, MicOff, Video, VideoOff, PhoneOff,
  SwitchCamera, Volume2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function ActiveCallScreen() {
  const {
    callState, activeCall, endReason, duration,
    cancelCall, endCall,
  } = useCallContext();
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const connectedAtRef = useRef<number>();

  const shouldShow = ['dialing', 'connecting', 'connected', 'reconnecting', 'ended', 'failed'].includes(callState);

  // Timer for connected state
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

  if (!shouldShow || !activeCall) return null;

  const isVideo = activeCall.callType === 'video';
  const isCaller = !!activeCall.calleeName;
  const remoteName = isCaller ? activeCall.calleeName : activeCall.callerName;
  const remoteAvatar = isCaller ? activeCall.calleeAvatar : activeCall.callerAvatar;

  const getStatusText = () => {
    switch (callState) {
      case 'dialing': return '正在呼叫...';
      case 'connecting': return '连接中...';
      case 'connected': return formatDuration(elapsedSeconds);
      case 'reconnecting': return '重新连接中...';
      case 'ended':
        switch (endReason) {
          case 'completed': return duration > 0 ? `通话结束 ${formatDuration(duration)}` : '通话已结束';
          case 'rejected': return '对方已拒绝';
          case 'cancelled': return '已取消';
          case 'missed': return '对方未接听';
          default: return '通话已结束';
        }
      case 'failed': return '通话失败';
      default: return '';
    }
  };

  const handleHangup = () => {
    if (callState === 'dialing') {
      cancelCall();
    } else {
      endCall();
    }
  };

  const toggleMute = () => setIsMuted(!isMuted);
  const toggleCamera = () => setIsCameraOff(!isCameraOff);

  const isActive = ['dialing', 'connecting', 'connected', 'reconnecting'].includes(callState);
  const isEnded = callState === 'ended' || callState === 'failed';

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gradient-to-b from-[#1a1a2e] to-[#16213e]">
      {/* Safe area top */}
      <div className="safe-area-top" />

      {/* Remote video placeholder / Audio call display */}
      <div className="flex flex-1 flex-col items-center justify-center">
        {isVideo && callState === 'connected' ? (
          // Video call - remote video would go here
          <div className="flex h-full w-full items-center justify-center">
            <p className="text-sm text-white/50">视频连接中...</p>
          </div>
        ) : (
          // Audio call or waiting states
          <div className="flex flex-col items-center">
            <div className="relative mb-6">
              {callState === 'dialing' && (
                <div className="absolute -inset-4 animate-pulse rounded-full border-2 border-white/20" />
              )}
              {callState === 'connected' && (
                <div className="absolute -inset-4 rounded-full border-2 border-green-400/30" />
              )}
              <UserAvatar src={remoteAvatar} name={remoteName} size="xl" />
            </div>
            <h2 className="mb-2 text-2xl font-semibold text-white">
              {remoteName || '未知用户'}
            </h2>
            <p className={cn(
              'text-sm',
              callState === 'connected' ? 'text-green-400' :
              isEnded ? 'text-red-400' : 'text-white/60'
            )}>
              {getStatusText()}
            </p>
          </div>
        )}
      </div>

      {/* Local video preview (video calls only) */}
      {isVideo && callState === 'connected' && !isCameraOff && (
        <div className="absolute right-4 top-16 h-40 w-28 overflow-hidden rounded-xl bg-stone-800 shadow-lg">
          <div className="flex h-full items-center justify-center">
            <p className="text-xs text-white/50">本地预览</p>
          </div>
        </div>
      )}

      {/* Control buttons */}
      {isActive && (
        <div className="safe-area-bottom pb-10">
          <div className="flex items-center justify-center gap-6">
            {/* Mute */}
            <button
              onClick={toggleMute}
              className={cn(
                'flex h-14 w-14 items-center justify-center rounded-full transition-all',
                isMuted ? 'bg-white text-stone-900' : 'bg-white/20 text-white'
              )}
            >
              {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
            </button>

            {/* Camera toggle (video only) */}
            {isVideo && (
              <button
                onClick={toggleCamera}
                className={cn(
                  'flex h-14 w-14 items-center justify-center rounded-full transition-all',
                  isCameraOff ? 'bg-white text-stone-900' : 'bg-white/20 text-white'
                )}
              >
                {isCameraOff ? <VideoOff className="h-6 w-6" /> : <Video className="h-6 w-6" />}
              </button>
            )}

            {/* Switch camera (video only) */}
            {isVideo && (
              <button className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 text-white">
                <SwitchCamera className="h-6 w-6" />
              </button>
            )}

            {/* Speaker */}
            <button className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 text-white">
              <Volume2 className="h-6 w-6" />
            </button>

            {/* Hangup */}
            <button
              onClick={handleHangup}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500 text-white shadow-lg transition-transform active:scale-95"
            >
              <PhoneOff className="h-7 w-7" />
            </button>
          </div>
        </div>
      )}

      {/* Ended state */}
      {isEnded && (
        <div className="safe-area-bottom pb-20">
          <p className="text-center text-sm text-white/40">通话即将关闭...</p>
        </div>
      )}
    </div>
  );
}
