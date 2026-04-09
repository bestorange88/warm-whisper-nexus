import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/** Leave a group conversation */
export function useLeaveGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { conversationId: string; userId: string }) => {
      const { error } = await supabase
        .from('conversation_members')
        .delete()
        .eq('conversation_id', params.conversationId)
        .eq('user_id', params.userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['conversation'] });
    },
  });
}

/** Remove a member from group (owner only) */
export function useRemoveMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { conversationId: string; userId: string }) => {
      const { error } = await supabase
        .from('conversation_members')
        .delete()
        .eq('conversation_id', params.conversationId)
        .eq('user_id', params.userId);
      if (error) throw error;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['conversation', vars.conversationId] });
    },
  });
}

/** Add members to a group */
export function useAddMembers() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { conversationId: string; userIds: string[] }) => {
      const rows = params.userIds.map((uid) => ({
        conversation_id: params.conversationId,
        user_id: uid,
        role: 'member',
      }));
      const { error } = await supabase.from('conversation_members').insert(rows);
      if (error) throw error;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['conversation', vars.conversationId] });
    },
  });
}

/** Rename a group conversation */
export function useRenameGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { conversationId: string; name: string }) => {
      const { error } = await supabase
        .from('conversations')
        .update({ name: params.name })
        .eq('id', params.conversationId);
      if (error) throw error;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['conversation', vars.conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}
