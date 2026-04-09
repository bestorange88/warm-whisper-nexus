import { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, Square, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface VoiceRecorderProps {
  onSend: (blob: Blob, durationSec: number) => void;
  disabled?: boolean;
}

export function VoiceRecorder({ onSend, disabled }: VoiceRecorderProps) {
  const { t } = useTranslation();
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);

  const cleanup = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
      mediaRecorder.current.stop();
    }
    mediaRecorder.current?.stream?.getTracks().forEach(t => t.stop());
    mediaRecorder.current = null;
    chunks.current = [];
    setElapsed(0);
    setRecording(false);
  }, []);

  useEffect(() => () => cleanup(), [cleanup]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';
      const recorder = new MediaRecorder(stream, { mimeType });
      chunks.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.current.push(e.data);
      };

      recorder.onstop = () => {
        const durationSec = Math.round((Date.now() - startTimeRef.current) / 1000);
        if (chunks.current.length > 0 && durationSec >= 1) {
          const blob = new Blob(chunks.current, { type: mimeType });
          onSend(blob, durationSec);
        }
        stream.getTracks().forEach(t => t.stop());
      };

      mediaRecorder.current = recorder;
      recorder.start(100);
      startTimeRef.current = Date.now();
      setRecording(true);

      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 500);
    } catch (err) {
      console.error('Microphone access denied:', err);
      // The toast is handled by the parent
    }
  };

  const stopAndSend = () => {
    if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
      mediaRecorder.current.stop(); // triggers onstop -> onSend
    }
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    setRecording(false);
    setElapsed(0);
  };

  const cancel = () => {
    // Prevent onstop from sending
    if (mediaRecorder.current) {
      mediaRecorder.current.ondataavailable = null;
      mediaRecorder.current.onstop = null;
      mediaRecorder.current.stream?.getTracks().forEach(t => t.stop());
      if (mediaRecorder.current.state !== 'inactive') mediaRecorder.current.stop();
    }
    cleanup();
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  if (recording) {
    return (
      <div className="flex items-center gap-2">
        <button onClick={cancel} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-destructive hover:bg-destructive/10">
          <X className="h-5 w-5" />
        </button>
        <div className="flex flex-1 items-center gap-2 rounded-2xl bg-stone-100 px-4 py-2.5">
          <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
          <span className="text-sm text-stone-600">{t('chat.recording')}</span>
          <span className="ml-auto text-sm font-medium text-stone-500">{formatTime(elapsed)}</span>
        </div>
        <button
          onClick={stopAndSend}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-white"
        >
          <Square className="h-4 w-4 fill-current" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={startRecording}
      disabled={disabled}
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-stone-400 hover:bg-stone-100 disabled:opacity-50"
      title={t('chat.holdToRecord')}
    >
      <Mic className="h-5 w-5" />
    </button>
  );
}
