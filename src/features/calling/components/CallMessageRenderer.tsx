import { Phone, Video } from 'lucide-react';
import { isCallMessage } from '../callMessageBuilder';

interface CallMessageRendererProps {
  content: string;
}

export function CallMessageRenderer({ content }: CallMessageRendererProps) {
  if (!isCallMessage(content)) return null;

  const isAudio = content.startsWith('[语音通话]');
  const displayText = content
    .replace('[语音通话] ', '')
    .replace('[视频通话] ', '');

  const hasDuration = displayText.includes('通话时长');

  return (
    <div className="flex items-center justify-center gap-2 py-2">
      <div className="flex items-center gap-1.5 rounded-full bg-stone-100 px-3 py-1.5 text-xs text-stone-500">
        {isAudio ? (
          <Phone className={`h-3.5 w-3.5 ${hasDuration ? 'text-green-500' : 'text-stone-400'}`} />
        ) : (
          <Video className={`h-3.5 w-3.5 ${hasDuration ? 'text-green-500' : 'text-stone-400'}`} />
        )}
        <span>{displayText}</span>
      </div>
    </div>
  );
}
