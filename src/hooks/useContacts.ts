import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Friendship, FriendRequest, Block, Profile } from '@/types';

export function useFriends(userId?: string) {
  return useQuery({
    queryKey: ['friends', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data: friendships, error } = await supabase
        .from('friendships')
        .select('*')
        .eq('user_id', userId);
      if (error) throw error;
      if (!friendships || friendships.length === 0) return [];

      const friendIds = friendships.map((f) => f.friend_id);
      const { data: profiles } = await supabase
        .from('public_profiles' as any)
        .select('*')
        .in('id', friendIds);

      return friendships.map((f) => ({
        ...f,
        friend: (profiles as any[])?.find((p: any) => p.id === f.friend_id),
      })) as unknown as Friendship[];
    },
    enabled: !!userId,
  });
}

export function useFriendRequests(userId?: string) {
  return useQuery({
    queryKey: ['friend_requests', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data: requests, error } = await supabase
        .from('friend_requests')
        .select('*')
        .eq('receiver_id', userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      if (error) throw error;
      if (!requests || requests.length === 0) return [];

      const senderIds = requests.map((r) => r.sender_id);
      const { data: profiles } = await supabase
        .from('public_profiles' as any)
        .select('*')
        .in('id', senderIds);

      return requests.map((r) => ({
        ...r,
        sender: (profiles as any[])?.find((p: any) => p.id === r.sender_id),
      })) as unknown as FriendRequest[];
    },
    enabled: !!userId,
  });
}

export function useSendFriendRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { sender_id: string; receiver_id: string; message?: string }) => {
      const [friendshipResult, sentPendingResult, receivedPendingResult] = await Promise.all([
        supabase
          .from('friendships')
          .select('id')
          .eq('user_id', params.sender_id)
          .eq('friend_id', params.receiver_id)
          .limit(1),
        supabase
          .from('friend_requests')
          .select('id')
          .eq('sender_id', params.sender_id)
          .eq('receiver_id', params.receiver_id)
          .eq('status', 'pending')
          .limit(1),
        supabase
          .from('friend_requests')
          .select('id')
          .eq('sender_id', params.receiver_id)
          .eq('receiver_id', params.sender_id)
          .eq('status', 'pending')
          .limit(1),
      ]);

      if (friendshipResult.error) throw friendshipResult.error;
      if (sentPendingResult.error) throw sentPendingResult.error;
      if (receivedPendingResult.error) throw receivedPendingResult.error;

      if ((friendshipResult.data?.length ?? 0) > 0) {
        throw new Error('already_friends');
      }
      if ((sentPendingResult.data?.length ?? 0) > 0) {
        throw new Error('request_already_sent');
      }
      if ((receivedPendingResult.data?.length ?? 0) > 0) {
        throw new Error('request_received_pending');
      }

      const { data, error } = await supabase
        .from('friend_requests')
        .insert(params)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as FriendRequest;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friend_requests'] });
    },
  });
}

export function useRespondFriendRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { requestId: string; status: 'accepted' | 'rejected'; senderId: string; receiverId: string }) => {
      const { error: updateErr } = await supabase
        .from('friend_requests')
        .update({ status: params.status, updated_at: new Date().toISOString() })
        .eq('id', params.requestId);
      if (updateErr) throw updateErr;

      if (params.status === 'accepted') {
        const friendships = [
          { user_id: params.senderId, friend_id: params.receiverId },
          { user_id: params.receiverId, friend_id: params.senderId },
        ];
        const { error: friendErr } = await supabase.from('friendships').insert(friendships);
        if (friendErr) throw friendErr;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friend_requests'] });
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    },
  });
}

export function useBlockUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { blocker_id: string; blocked_id: string; reason?: string }) => {
      const { data, error } = await supabase
        .from('blocks')
        .insert(params)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as Block;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocks'] });
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    },
  });
}

export function useUnblockUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { blocker_id: string; blocked_id: string }) => {
      const { error } = await supabase
        .from('blocks')
        .delete()
        .eq('blocker_id', params.blocker_id)
        .eq('blocked_id', params.blocked_id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocks'] });
    },
  });
}

export function useBlocks(userId?: string) {
  return useQuery({
    queryKey: ['blocks', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data: blocks, error } = await supabase
        .from('blocks')
        .select('*')
        .eq('blocker_id', userId);
      if (error) throw error;
      if (!blocks || blocks.length === 0) return [];

      const blockedIds = blocks.map((b) => b.blocked_id);
      const { data: profiles } = await supabase
        .from('public_profiles' as any)
        .select('*')
        .in('id', blockedIds);

      return blocks.map((b) => ({
        ...b,
        blocked_user: (profiles as any[])?.find((p: any) => p.id === b.blocked_id),
      })) as unknown as Block[];
    },
    enabled: !!userId,
  });
}

export function useSearchUsers(query: string) {
  return useQuery({
    queryKey: ['search_users', query],
    queryFn: async () => {
      if (!query || query.length < 2) return [];
      const { data, error } = await supabase
        .from('public_profiles' as any)
        .select('*')
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
        .limit(20);
      if (error) throw error;
      return (data || []) as unknown as Profile[];
    },
    enabled: query.length >= 2,
  });
}
