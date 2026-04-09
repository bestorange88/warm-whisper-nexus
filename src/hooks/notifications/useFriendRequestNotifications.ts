import { useEffect, useRef } from 'react';
import type { User } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import i18n from '@/i18n';

type PendingFriendRequest = {
  id: string;
  sender_id: string;
  created_at?: string | null;
};

const SESSION_STORAGE_PREFIX = 'friend-request-toast-seen';

function getStorageKey(userId: string) {
  return `${SESSION_STORAGE_PREFIX}:${userId}`;
}

function readSeenRequestIds(userId: string) {
  if (typeof window === 'undefined') return new Set<string>();

  try {
    const raw = window.sessionStorage.getItem(getStorageKey(userId));
    const parsed = raw ? JSON.parse(raw) : [];
    const ids = Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === 'string')
      : [];

    return new Set(ids);
  } catch {
    return new Set<string>();
  }
}

function writeSeenRequestIds(userId: string, ids: Set<string>) {
  if (typeof window === 'undefined') return;

  window.sessionStorage.setItem(
    getStorageKey(userId),
    JSON.stringify(Array.from(ids).slice(-50))
  );
}

function dedupeLatestRequestsBySender(requests: PendingFriendRequest[]) {
  const latestBySender = new Map<string, PendingFriendRequest>();

  for (const request of requests) {
    if (!latestBySender.has(request.sender_id)) {
      latestBySender.set(request.sender_id, request);
    }
  }

  return Array.from(latestBySender.values());
}

export function useFriendRequestNotifications(user: User | null) {
  const queryClient = useQueryClient();
  const requestIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user) {
      requestIdsRef.current = new Set();
      return;
    }

    let isActive = true;
    const t = i18n.t.bind(i18n);
    const seenRequestIds = readSeenRequestIds(user.id);

    const rememberRequestIds = (ids: Iterable<string>) => {
      for (const id of ids) {
        seenRequestIds.add(id);
      }

      writeSeenRequestIds(user.id, seenRequestIds);
    };

    const showToast = async (request: Pick<PendingFriendRequest, 'id' | 'sender_id'>) => {
      const { data: sender } = await supabase
        .from('public_profiles' as any)
        .select('display_name, username')
        .eq('id', request.sender_id)
        .single();

      if (!isActive) return;

      const name = sender?.display_name || sender?.username || '';

      toast(t('contacts.friendRequestReceived', { name }), {
        action: {
          label: t('common.view'),
          onClick: () => {
            window.location.href = '/friend-requests';
          },
        },
        duration: 5000,
      });
    };

    const bootstrapPendingRequests = async () => {
      const { data } = await supabase
        .from('friend_requests')
        .select('id, sender_id, created_at')
        .eq('receiver_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(20);

      if (!isActive) return;

      const requests = (data ?? []) as PendingFriendRequest[];
      requestIdsRef.current = new Set(requests.map((item) => item.id));

      const unseenRequests = dedupeLatestRequestsBySender(requests)
        .filter((request) => !seenRequestIds.has(request.id))
        .slice(0, 3)
        .reverse();

      for (const request of unseenRequests) {
        rememberRequestIds([request.id]);
        await showToast(request);
      }
    };

    const channel = supabase
      .channel(`global-friend-requests:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'friend_requests',
          filter: `receiver_id=eq.${user.id}`,
        },
        async (payload) => {
          const request = payload.new as { id: string; sender_id: string };

          if (requestIdsRef.current.has(request.id)) return;

          requestIdsRef.current.add(request.id);
          rememberRequestIds([request.id]);

          queryClient.invalidateQueries({ queryKey: ['friend_requests', user.id] });

          await showToast(request);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          void bootstrapPendingRequests();
        }
      });

    return () => {
      isActive = false;
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);
}