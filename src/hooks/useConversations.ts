import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Conversation, ConversationMember, Message, Profile } from '@/types';

export function useConversations(userId?: string) {
  return useQuery({
    queryKey: ['conversations', userId],
    queryFn: async () => {
      if (!userId) return [];

      // Fetch blocked users to hide their conversations
      const { data: blocks } = await supabase
        .from('blocks')
        .select('blocked_id')
        .eq('blocker_id', userId);
      const blockedSet = new Set((blocks || []).map((b) => b.blocked_id));

      // Get user's conversation memberships
      const { data: memberships, error: memErr } = await supabase
        .from('conversation_members')
        .select('conversation_id, is_pinned')
        .eq('user_id', userId);
      if (memErr) throw memErr;
      if (!memberships || memberships.length === 0) return [];

      const convIds = memberships.map((m) => m.conversation_id);
      const pinnedSet = new Set(
        memberships.filter((m) => m.is_pinned).map((m) => m.conversation_id)
      );

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

          // Skip conversations with blocked users
          if (otherUserId && blockedSet.has(otherUserId)) {
            continue;
          }

          if (otherUserId) {
            const { data: profile } = await supabase
              .from('public_profiles' as any)
              .select('*')
              .eq('id', otherUserId)
              .single();
            if (profile) {
              c.other_user = profile as unknown as Profile;
            }
          }
        }

        // Get unread count and pinned status
        c.is_pinned = pinnedSet.has(c.id);
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

      // Sort: pinned first, then by updated_at desc
      result.sort((a, b) => {
        if (a.is_pinned && !b.is_pinned) return -1;
        if (!a.is_pinned && b.is_pinned) return 1;
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      });

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

      const conv = data as unknown as Conversation;

      // Fetch members with profiles for group chats
      if (conv.type === 'group') {
        const { data: members } = await supabase
          .from('conversation_members')
          .select('*')
          .eq('conversation_id', conversationId);

        if (members && members.length > 0) {
          const userIds = members.map((m) => m.user_id);
          const { data: profiles } = await supabase
            .from('public_profiles' as any)
            .select('*')
            .in('id', userIds);

          conv.members = members.map((m) => ({
            ...m,
            profile: (profiles as any[])?.find((p: any) => p.id === m.user_id),
          })) as unknown as ConversationMember[];
        }
      }

      return conv;
    },
    enabled: !!conversationId,
  });
}

export function useMessages(conversationId?: string) {
  const queryClient = useQueryClient();

  // Subscribe to realtime messages (INSERT + UPDATE for recalls)
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
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

      // Filter out messages from blocked users
      const { data: authData } = await supabase.auth.getUser();
      const currentUserId = authData.user?.id;
      let blockedSet = new Set<string>();
      if (currentUserId) {
        const { data: blocks } = await supabase
          .from('blocks')
          .select('blocked_id')
          .eq('blocker_id', currentUserId);
        blockedSet = new Set((blocks || []).map((b) => b.blocked_id));
      }

      const { data: msgs, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true })
        .limit(100);
      if (error) throw error;
      if (!msgs || msgs.length === 0) return [];

      // Remove messages from blocked users
      const visibleMsgs = currentUserId
        ? msgs.filter((m) => m.sender_id === currentUserId || !blockedSet.has(m.sender_id))
        : msgs;

      // Fetch sender profiles via public_profiles view
      const senderIds = [...new Set(visibleMsgs.map((m) => m.sender_id))];
      const { data: profiles } = await supabase
        .from('public_profiles' as any)
        .select('*')
        .in('id', senderIds);

      return visibleMsgs.map((m) => ({
        ...m,
        sender: (profiles as any[])?.find((p: any) => p.id === m.sender_id) || null,
      })) as unknown as Message[];
    },
    enabled: !!conversationId,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (msg: { conversation_id: string; sender_id: string; type: string; content?: string; media_url?: string; file_name?: string; file_size?: number; reply_to?: string }) => {
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

      // Insert owner first, then other members
      const { error: ownerErr } = await supabase.from('conversation_members').insert({
        conversation_id: conv!.id,
        user_id: params.createdBy,
        role: 'owner',
      });
      if (ownerErr) throw ownerErr;

      const otherMembers = params.memberIds
        .filter((uid) => uid !== params.createdBy)
        .map((uid) => ({
          conversation_id: conv!.id,
          user_id: uid,
          role: 'member',
        }));
      if (otherMembers.length > 0) {
        const { error: memErr } = await supabase.from('conversation_members').insert(otherMembers);
        if (memErr) throw memErr;
      }
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

      // Insert owner first so is_conversation_owner check passes for the second insert
      const { error: ownerErr } = await supabase.from('conversation_members').insert({
        conversation_id: conv!.id, user_id: params.currentUserId, role: 'owner',
      });
      if (ownerErr) throw ownerErr;

      const { error: memErr } = await supabase.from('conversation_members').insert({
        conversation_id: conv!.id, user_id: params.otherUserId, role: 'member',
      });
      if (memErr) throw memErr;

      return conv as unknown as Conversation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

/** Recall (soft-delete) a message — only sender within 2 minutes */
export function useRecallMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { messageId: string; conversationId: string; senderId: string; createdAt: string }) => {
      const twoMinutes = 2 * 60 * 1000;
      if (Date.now() - new Date(params.createdAt).getTime() > twoMinutes) {
        throw new Error('只能撤回 2 分钟内的消息');
      }
      const { error } = await supabase
        .from('messages')
        .update({ is_deleted: true, content: null, media_url: null })
        .eq('id', params.messageId)
        .eq('sender_id', params.senderId);
      if (error) throw error;
    },
    onSuccess: (_, params) => {
      queryClient.invalidateQueries({ queryKey: ['messages', params.conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

/** Delete a message from view (mark as deleted) */
export function useDeleteMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { messageId: string; conversationId: string; senderId: string }) => {
      const { error } = await supabase
        .from('messages')
        .update({ is_deleted: true })
        .eq('id', params.messageId)
        .eq('sender_id', params.senderId);
      if (error) throw error;
    },
    onSuccess: (_, params) => {
      queryClient.invalidateQueries({ queryKey: ['messages', params.conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

/** Track the other user's last_read_at for read receipts in a direct chat */
export function useReadReceipt(conversationId?: string, otherUserId?: string | null) {
  const queryClient = useQueryClient();

  // Subscribe to realtime changes on conversation_members for this conversation
  useEffect(() => {
    if (!conversationId || !otherUserId) return;
    const channel = supabase
      .channel(`read-receipt:${conversationId}:${otherUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversation_members',
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['read-receipt', conversationId, otherUserId] });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [conversationId, otherUserId, queryClient]);

  return useQuery({
    queryKey: ['read-receipt', conversationId, otherUserId],
    queryFn: async () => {
      if (!conversationId || !otherUserId) return null;
      const { data, error } = await supabase
        .from('conversation_members')
        .select('last_read_at')
        .eq('conversation_id', conversationId)
        .eq('user_id', otherUserId)
        .single();
      if (error) return null;
      return data?.last_read_at ?? null;
    },
    enabled: !!conversationId && !!otherUserId,
  });
}

/** Toggle pin/unpin a conversation */
export function useTogglePin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { conversationId: string; userId: string; pinned: boolean }) => {
      const { error } = await supabase
        .from('conversation_members')
        .update({ is_pinned: params.pinned })
        .eq('conversation_id', params.conversationId)
        .eq('user_id', params.userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}
