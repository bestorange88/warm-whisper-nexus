import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Conversation, Message } from '@/types';

export function useConversations(userId?: string) {
  return useQuery({
    queryKey: ['conversations', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data: memberships, error: memErr } = await supabase
        .from('conversation_members')
        .select('conversation_id')
        .eq('user_id', userId);
      if (memErr) throw memErr;
      if (!memberships || memberships.length === 0) return [];

      const convIds = memberships.map((m) => m.conversation_id);
      const { data: convs, error: convErr } = await supabase
        .from('conversations')
        .select('*')
        .in('id', convIds)
        .order('updated_at', { ascending: false });
      if (convErr) throw convErr;
      return (convs || []) as unknown as Conversation[];
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
