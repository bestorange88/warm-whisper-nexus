import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const TYPING_TIMEOUT_MS = 3000;

/**
 * Manages typing indicator state using Supabase Realtime Presence.
 * Returns { isOtherTyping, sendTyping } for direct chats,
 * or { typingUsers, sendTyping } for group chats.
 */
export function useTypingIndicator(conversationId?: string, userId?: string) {
  const [typingUsers, setTypingUsers] = useState<Map<string, string>>(new Map());
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSentRef = useRef<number>(0);

  useEffect(() => {
    if (!conversationId || !userId) return;

    const channel = supabase.channel(`typing:${conversationId}`, {
      config: { presence: { key: userId } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const newTyping = new Map<string, string>();
        for (const [key, presences] of Object.entries(state)) {
          if (key === userId) continue;
          const p = presences[0] as any;
          if (p?.typing) {
            newTyping.set(key, p.display_name || key);
          }
        }
        setTypingUsers(newTyping);
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [conversationId, userId]);

  // Clear typing users that go stale (fallback)
  useEffect(() => {
    if (typingUsers.size === 0) return;
    const timer = setTimeout(() => {
      setTypingUsers(new Map());
    }, TYPING_TIMEOUT_MS + 500);
    return () => clearTimeout(timer);
  }, [typingUsers]);

  const sendTyping = useCallback(
    (displayName?: string) => {
      if (!channelRef.current) return;
      const now = Date.now();
      // Throttle: don't send more than once per second
      if (now - lastSentRef.current < 1000) return;
      lastSentRef.current = now;

      channelRef.current.track({
        typing: true,
        display_name: displayName || '',
      });

      // Auto-clear after timeout
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        channelRef.current?.track({ typing: false });
      }, TYPING_TIMEOUT_MS);
    },
    []
  );

  const isOtherTyping = typingUsers.size > 0;
  const typingDisplayNames = Array.from(typingUsers.values());

  return { isOtherTyping, typingUsers: typingDisplayNames, sendTyping };
}
