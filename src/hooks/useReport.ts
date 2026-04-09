import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Report, ReportReason } from '@/types';

export function useReportReasons() {
  return useQuery({
    queryKey: ['report_reasons'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('report_reasons')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return (data || []) as ReportReason[];
    },
  });
}

export function useSubmitReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (report: Omit<Report, 'id' | 'status' | 'admin_notes' | 'resolved_by' | 'resolved_at' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('reports')
        .insert(report)
        .select()
        .single();
      if (error) throw error;
      return data as Report;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}
