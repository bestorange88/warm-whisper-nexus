import { useCallContext } from '../CallProvider';
import { UserAvatar } from '@/components/avatar/UserAvatar';
import { Phone, PhoneOff, Video } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function IncomingCallModal() {
  const { t } = useTranslation();
  const { callState, activeCall, acceptCall, rejectCall } = useCallContext();

  if (callState !== 'incoming' || !activeCall) return null;

  const isVideo = activeCall.callType === 'video';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="flex w-80 flex-col items-center rounded-3xl bg-gradient-to-b from-stone-800 to-stone-900 p-8 shadow-2xl">
        <div className="relative mb-6">
          <div className="animate-ping absolute inset-0 rounded-full bg-green-400/20" />
          <UserAvatar
            src={activeCall.callerAvatar}
            name={activeCall.callerName}
            size="xl"
          />
        </div>

        <h2 className="mb-1 text-xl font-semibold text-white">
          {activeCall.callerName || t('calling.unknownUser')}
        </h2>
        <p className="mb-8 text-sm text-stone-400">
          {isVideo ? t('calling.incomingVideo') : t('calling.incomingVoice')} {t('calling.incomingLabel')}
        </p>

        <div className="flex w-full items-center justify-around">
          <button
            onClick={rejectCall}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500 text-white shadow-lg transition-transform active:scale-95"
          >
            <PhoneOff className="h-7 w-7" />
          </button>
          <button
            onClick={acceptCall}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500 text-white shadow-lg transition-transform active:scale-95"
          >
            {isVideo ? <Video className="h-7 w-7" /> : <Phone className="h-7 w-7" />}
          </button>
        </div>

        <div className="mt-6 flex w-full justify-around text-xs text-stone-500">
          <span>{t('calling.decline')}</span>
          <span>{t('calling.accept')}</span>
        </div>
      </div>
    </div>
  );
}
