import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Conversation, Message, Profile } from '@/types';

export function useConversations(userId?: string) {
  return useQuery({
    queryKey: ['conversations', userId],
    queryFn: async () => {
      if (!userId) return [];

      // Get user's conversation memberships
      const { data: memberships, error: memErr } = await supabase
        .from('conversation_members')
        .select('conversation_id')
        .eq('user_id', userId);
      if (memErr) throw memErr;
      if (!memberships || memberships.length === 0) return [];

      const convIds = memberships.map((m) => m.conversation_id);

      // Get conversations
      const { data: convs, error: convErr } = await supabase
        .from('conversations')
        .select('*')
        .in('id', convIds)
        .order('updated_at', { ascending: false });
      if (convErr) throw convErr;
      if (!convs || convs.length === 0) return [];

      // For each conversation, get last message and other user info for direct chats
      const result: Conversation[] = [];
      for (const conv of convs) {
        const c = conv as unknown as Conversation;

        // Get last message
        const { data: lastMsgs } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', c.id)
          .eq('is_deleted', false)
          .order('created_at', { ascending: false })
          .limit(1);
        if (lastMsgs && lastMsgs.length > 0) {
          c.last_message = lastMsgs[0] as unknown as Message;
        }

        // For direct chats, get the other user's profile
        if (c.type === 'direct') {
          const { data: members } = await supabase
            .from('conversation_members')
            .select('user_id')
            .eq('conversation_id', c.id);
          const otherUserId = members?.find((m) => m.user_id !== userId)?.user_id;
          if (otherUserId) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', otherUserId)
              .single();
            if (profile) {
              c.other_user = profile as unknown as Profile;
            }
          }
        }

        // Get unread count
        const { data: membership } = await supabase
          .from('conversation_members')
          .select('last_read_at')
          .eq('conversation_id', c.id)
          .eq('user_id', userId)
          .single();
        if (membership?.last_read_at) {
          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', c.id)
            .eq('is_deleted', false)
            .neq('sender_id', userId)
            .gt('created_at', membership.last_read_at);
          c.unread_count = count ?? 0;
        }

        result.push(c);
      }

      return result;
    },
    enabled: !!userId,
  });
}

export function useConversation(conversationId?: string) {
  return useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: async () => {
      if (!conversationId) return null;
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single();
      if (error) throw error;
      return data as unknown as Conversation;
    },
    enabled: !!conversationId,
  });
}

export function useMessages(conversationId?: string) {
  const queryClient = useQueryClient();

  // Subscribe to realtime messages
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
          queryClient.invalidateQueries({ queryKey: ['conversations'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, queryClient]);

  return useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      if (!conversationId) return [];
      const { data, error } = await supabase
        .from('messages')
        .select('*, sender:profiles!messages_sender_id_fkey(*)')
        .eq('conversation_id', conversationId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true })
        .limit(100);
      if (error) throw error;
      return (data || []) as unknown as Message[];
    },
    enabled: !!conversationId,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (msg: { conversation_id: string; sender_id: string; type: string; content?: string; media_url?: string; file_name?: string; file_size?: number }) => {
      const { data, error } = await supabase
        .from('messages')
        .insert(msg)
        .select()
        .single();
      if (error) throw error;
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', msg.conversation_id);
      return data as unknown as Message;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['messages', data.conversation_id] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useCreateConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { type: 'direct' | 'group'; name?: string; memberIds: string[]; createdBy: string }) => {
      const { data: conv, error: convErr } = await supabase
        .from('conversations')
        .insert({ type: params.type, name: params.name || null, created_by: params.createdBy })
        .select()
        .single();
      if (convErr) throw convErr;

      const members = params.memberIds.map((uid) => ({
        conversation_id: conv!.id,
        user_id: uid,
        role: uid === params.createdBy ? 'owner' : 'member',
      }));
      const { error: memErr } = await supabase.from('conversation_members').insert(members);
      if (memErr) throw memErr;
      return conv as unknown as Conversation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

/** Find or create a direct conversation with another user */
export function useFindOrCreateDirectChat() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { currentUserId: string; otherUserId: string }) => {
      // Check if a direct conversation already exists between these two users
      const { data: myMemberships } = await supabase
        .from('conversation_members')
        .select('conversation_id')
        .eq('user_id', params.currentUserId);

      if (myMemberships && myMemberships.length > 0) {
        const myConvIds = myMemberships.map((m) => m.conversation_id);

        // Find conversations where the other user is also a member
        const { data: otherMemberships } = await supabase
          .from('conversation_members')
          .select('conversation_id')
          .eq('user_id', params.otherUserId)
          .in('conversation_id', myConvIds);

        if (otherMemberships && otherMemberships.length > 0) {
          const sharedConvIds = otherMemberships.map((m) => m.conversation_id);
          // Check if any of these shared conversations are direct type
          const { data: directConvs } = await supabase
            .from('conversations')
            .select('*')
            .in('id', sharedConvIds)
            .eq('type', 'direct')
            .limit(1);

          if (directConvs && directConvs.length > 0) {
            return directConvs[0] as unknown as Conversation;
          }
        }
      }

      // No existing direct chat, create one
      const { data: conv, error: convErr } = await supabase
        .from('conversations')
        .insert({ type: 'direct', created_by: params.currentUserId })
        .select()
        .single();
      if (convErr) throw convErr;

      const members = [
        { conversation_id: conv!.id, user_id: params.currentUserId, role: 'owner' },
        { conversation_id: conv!.id, user_id: params.otherUserId, role: 'member' },
      ];
      const { error: memErr } = await supabase.from('conversation_members').insert(members);
      if (memErr) throw memErr;

      return conv as unknown as Conversation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}
