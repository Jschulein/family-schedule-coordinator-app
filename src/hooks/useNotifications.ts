
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { Json } from '@/integrations/supabase/types';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export type Notification = {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  created_at: string;
  action_url?: string;
};

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
    subscribeToNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Validate and convert notification types before setting state
      const validNotifications = (data || []).map(notification => ({
        ...notification,
        type: validateNotificationType(notification.type)
      })) as Notification[];
      
      setNotifications(validNotifications);
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to validate notification type
  const validateNotificationType = (type: string): NotificationType => {
    const validTypes: NotificationType[] = ['info', 'success', 'warning', 'error'];
    return validTypes.includes(type as NotificationType) 
      ? (type as NotificationType) 
      : 'info'; // Default to 'info' for any invalid types
  };

  const subscribeToNotifications = () => {
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications'
        },
        (payload) => {
          const newNotification = payload.new as any;
          setNotifications(prev => [{
            ...newNotification,
            type: validateNotificationType(newNotification.type)
          } as Notification, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(notif =>
          notif.id === id ? { ...notif, read: true } : notif
        )
      );
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to update notification');
    }
  };

  return {
    notifications,
    loading,
    markAsRead,
    refetch: fetchNotifications
  };
};
