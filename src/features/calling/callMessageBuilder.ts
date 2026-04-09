import { formatDuration } from './utils';
import type { CallType, CallEndReason } from './types';
import i18n from '@/i18n';

export function buildCallMessage(callType: CallType, reason: CallEndReason, durationSeconds: number): string {
  const t = i18n.t.bind(i18n);
  const label = callType === 'audio' ? t('calling.voiceCall') : t('calling.videoCall');

  switch (reason) {
    case 'completed':
      if (durationSeconds > 0) {
        return `[${label}] ${t('calling.duration', { duration: formatDuration(durationSeconds) })}`;
      }
      return `[${label}] ${t('calling.callEnded')}`;
    case 'rejected':
      return `[${label}] ${t('calling.rejected')}`;
    case 'cancelled':
      return `[${label}] ${t('calling.cancelled')}`;
    case 'missed':
      return `[${label}] ${t('calling.missed')}`;
    case 'failed':
    case 'permission_denied':
      return `[${label}] ${t('calling.failed')}`;
    default:
      return `[${label}] ${t('calling.callEnded')}`;
  }
}

export function isCallMessage(content: string | null): boolean {
  if (!content) return false;
  // Match both Chinese and English call labels
  return /^\[(语音通话|视频通话|Voice Call|Video Call)\]/.test(content);
}
