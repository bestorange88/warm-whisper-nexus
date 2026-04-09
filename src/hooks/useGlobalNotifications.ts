import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

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

  // Keep track of conversations the user belongs to
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

    // Refresh when conversations change
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

  // Listen to all new messages
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

          // Don't notify for own messages
          if (msg.sender_id === user.id) return;

          // Only notify for conversations we're a member of
          if (!memberConvIdsRef.current.includes(msg.conversation_id)) return;

          // Don't notify if currently viewing that chat
          const currentChat = location.pathname.match(/^\/chat\/(.+)$/)?.[1];
          if (currentChat === msg.conversation_id) return;

          // Invalidate conversations list for unread count
          queryClient.invalidateQueries({ queryKey: ['conversations'] });

          // Fetch sender profile for display
          const { data: sender } = await supabase
            .from('profiles')
            .select('display_name, username, avatar_url')
            .eq('id', msg.sender_id)
            .single();

          const senderName = sender?.display_name || sender?.username || '新消息';
          let preview = msg.content || '';
          if (msg.type === 'image') preview = '[图片]';
          else if (msg.type === 'file') preview = '[文件]';
          else if (msg.type === 'audio') preview = '[语音]';
          else if (msg.type === 'video') preview = '[视频]';
          if (preview.length > 30) preview = preview.slice(0, 30) + '…';

          toast(senderName, {
            description: preview,
            action: {
              label: '查看',
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
}
