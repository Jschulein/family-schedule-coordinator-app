
import { useNotifications } from '@/hooks/useNotifications';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';

export const NotificationList = () => {
  const { notifications, loading, markAsRead } = useNotifications();

  if (loading) {
    return <div className="p-4 text-center">Loading notifications...</div>;
  }

  if (notifications.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        No notifications yet
      </div>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-8rem)] pr-4">
      <div className="space-y-4">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`p-4 rounded-lg border ${
              notification.read ? 'bg-muted' : 'bg-background'
            }`}
          >
            <div className="flex justify-between items-start gap-2">
              <div>
                <h4 className="text-sm font-semibold">{notification.title}</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {notification.message}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {formatDistanceToNow(new Date(notification.created_at), {
                    addSuffix: true,
                  })}
                </p>
              </div>
              {!notification.read && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => markAsRead(notification.id)}
                >
                  Mark as read
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};
