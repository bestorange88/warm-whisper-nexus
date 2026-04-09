import { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoicePlayerProps {
  src: string;
  duration?: number;
  isOwn: boolean;
}

export function VoicePlayer({ src, duration: propDuration, isOwn }: VoicePlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrent] = useState(0);
  const [duration, setDuration] = useState(propDuration || 0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoaded = () => {
      if (audio.duration && isFinite(audio.duration)) setDuration(audio.duration);
    };
    const onTime = () => setCurrent(audio.currentTime);
    const onEnded = () => { setPlaying(false); setCurrent(0); };

    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('ended', onEnded);
    return () => {
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('ended', onEnded);
    };
  }, []);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play();
      setPlaying(true);
    }
  }, [playing]);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Width proportional to duration (min 120px, max 200px)
  const barWidth = Math.min(200, Math.max(120, (duration || 3) * 20));

  return (
    <div className="flex items-center gap-2" style={{ width: barWidth }}>
      <audio ref={audioRef} src={src} preload="metadata" />
      <button
        onClick={toggle}
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
          isOwn ? 'bg-white/20 text-white' : 'bg-stone-200 text-stone-600'
        )}
      >
        {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
      </button>
      <div className="flex flex-1 flex-col gap-0.5">
        <div className={cn('h-1 rounded-full', isOwn ? 'bg-white/30' : 'bg-stone-200')}>
          <div
            className={cn('h-full rounded-full transition-all', isOwn ? 'bg-white' : 'bg-stone-500')}
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className={cn('text-[10px]', isOwn ? 'text-white/70' : 'text-stone-400')}>
          {playing ? formatTime(currentTime) : formatTime(duration)}
        </span>
      </div>
    </div>
  );
}
