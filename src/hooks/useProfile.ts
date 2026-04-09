import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Profile, PublicProfile } from '@/types';

/** Fetches own profile (full, including email/phone) — only works for auth.uid() */
export function useProfile(userId?: string) {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (error) throw error;
      return data as unknown as Profile;
    },
    enabled: !!userId,
  });
}

/** Fetches another user's public profile (no email/phone) via public_profiles view */
export function usePublicProfile(userId?: string) {
  return useQuery({
    queryKey: ['public_profile', userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from('public_profiles' as any)
        .select('*')
        .eq('id', userId)
        .single();
      if (error) throw error;
      return data as unknown as PublicProfile;
    },
    enabled: !!userId,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (updates: { id: string; display_name?: string; bio?: string; phone?: string; avatar_url?: string }) => {
      const { id, ...rest } = updates;
      const { data, error } = await supabase
        .from('profiles')
        .update({ ...rest, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as Profile;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['profile', data.id] });
    },
  });
}
