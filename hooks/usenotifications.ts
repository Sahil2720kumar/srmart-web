// hooks/notifications/useNotifications.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

// ─── Types ────────────────────────────────────────────────────────────────────

export type NotificationType =
  | 'order'
  | 'payment'
  | 'delivery'
  | 'promotion'
  | 'system'
  | 'review';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType | null;
  is_read: boolean;
  reference_id: string | null;
  reference_type: string | null;
  action_url: string | null;
  created_at: string;
}

// ─── Query Keys ───────────────────────────────────────────────────────────────
// Admin panel: no user_id scoping — admin sees ALL notifications

const notifKeys = {
  all:   ['notifications', 'all']          as const,
  count: ['notifications', 'unread-count'] as const,
};

// ─── All notifications — no user_id filter (admin sees everything) ────────────

export function useNotifications() {
  return useQuery({
    queryKey: notifKeys.all,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as Notification[];
    },
    refetchInterval: 60_000,
  });
}

// ─── Unread count (platform-wide, no user filter) ────────────────────────────

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: notifKeys.count,
    queryFn: async () => {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false);
      if (error) throw error;
      return count ?? 0;
    },
    refetchInterval: 30_000,
  });
}

// ─── Mark a single notification as read ──────────────────────────────────────

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (notifId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notifId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notifKeys.all });
      qc.invalidateQueries({ queryKey: notifKeys.count });
    },
  });
}

// ─── Mark ALL notifications as read ──────────────────────────────────────────

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('is_read', false);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notifKeys.all });
      qc.invalidateQueries({ queryKey: notifKeys.count });
    },
  });
}