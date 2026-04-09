import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import i18n from '@/i18n';

/**
 * Global listener for new messages across all conversations.
 * Shows a toast when a new message arrives in a conversation
 * the user is NOT currently viewing.
 */
export function useGlobalNotifications() {
  const { user } = useAuth();
  const location = useLocation();
  const queryClient = useQueryClient();
  const memberConvIdsRef = useRef<string[]>([]);

  useEffect(() => {
    if (!user) return;

    const fetchConvIds = async () => {
      const { data } = await supabase
        .from('conversation_members')
        .select('conversation_id')
        .eq('user_id', user.id);
      memberConvIdsRef.current = data?.map((m) => m.conversation_id) ?? [];
    };

    fetchConvIds();

    const channel = supabase
      .channel('global-membership')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversation_members' },
        () => fetchConvIds()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('global-new-messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        async (payload) => {
          const msg = payload.new as {
            id: string;
            conversation_id: string;
            sender_id: string;
            content: string | null;
            type: string;
          };

          if (msg.sender_id === user.id) return;
          if (!memberConvIdsRef.current.includes(msg.conversation_id)) return;

          const currentChat = location.pathname.match(/^\/chat\/(.+)$/)?.[1];
          if (currentChat === msg.conversation_id) return;

          queryClient.invalidateQueries({ queryKey: ['conversations'] });

          const { data: sender } = await supabase
            .from('profiles')
            .select('display_name, username, avatar_url')
            .eq('id', msg.sender_id)
            .single();

          const t = i18n.t.bind(i18n);
          const senderName = sender?.display_name || sender?.username || t('nav.messages');
          let preview = msg.content || '';
          if (msg.type === 'image') preview = `[${t('chat.image')}]`;
          else if (msg.type === 'file') preview = `[${t('chat.file')}]`;
          else if (msg.type === 'audio') preview = `[${t('chat.audio')}]`;
          else if (msg.type === 'video') preview = `[${t('chat.video')}]`;
          if (preview.length > 30) preview = preview.slice(0, 30) + '…';

          toast(senderName, {
            description: preview,
            action: {
              label: t('common.view'),
              onClick: () => {
                window.location.href = `/chat/${msg.conversation_id}`;
              },
            },
            duration: 4000,
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, location.pathname, queryClient]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('global-friend-requests')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'friend_requests',
          filter: `receiver_id=eq.${user.id}`,
        },
        async (payload) => {
          const req = payload.new as { sender_id: string };

          queryClient.invalidateQueries({ queryKey: ['friend-requests'] });

          const { data: sender } = await supabase
            .from('profiles')
            .select('display_name, username')
            .eq('id', req.sender_id)
            .single();

          const t = i18n.t.bind(i18n);
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
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('global-group-invites')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversation_members',
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          const member = payload.new as { conversation_id: string; role: string };

          if (member.role === 'owner') return;

          queryClient.invalidateQueries({ queryKey: ['conversations'] });

          const { data: conv } = await supabase
            .from('conversations')
            .select('name, type')
            .eq('id', member.conversation_id)
            .single();

          if (!conv || conv.type !== 'group') return;

          const t = i18n.t.bind(i18n);

          toast(t('contacts.groupInviteReceived', { name: conv.name || t('chat.groupChat') }), {
            action: {
              label: t('common.view'),
              onClick: () => {
                window.location.href = `/chat/${member.conversation_id}`;
              },
            },
            duration: 5000,
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient]);
}
