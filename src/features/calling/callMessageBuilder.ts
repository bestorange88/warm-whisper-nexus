import { formatDuration } from './utils';
import type { CallType, CallEndReason } from './types';

export function buildCallMessage(callType: CallType, reason: CallEndReason, durationSeconds: number): string {
  const label = callType === 'audio' ? '语音通话' : '视频通话';

  switch (reason) {
    case 'completed':
      if (durationSeconds > 0) {
        return `[${label}] 通话时长 ${formatDuration(durationSeconds)}`;
      }
      return `[${label}] 通话已结束`;
    case 'rejected':
      return `[${label}] 已拒绝`;
    case 'cancelled':
      return `[${label}] 已取消`;
    case 'missed':
      return `[${label}] 未接听`;
    case 'failed':
    case 'permission_denied':
      return `[${label}] 通话失败`;
    default:
      return `[${label}] 通话已结束`;
  }
}

export function isCallMessage(content: string | null): boolean {
  if (!content) return false;
  return content.startsWith('[语音通话]') || content.startsWith('[视频通话]');
}
