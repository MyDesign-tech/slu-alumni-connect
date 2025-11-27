"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, X, MessageSquare, Calendar, Heart, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useHydratedAuthStore } from '@/hooks/use-auth-store';

interface Notification {
  id: string;
  recipientEmail: string;
  senderEmail: string;
  senderName: string;
  type: 'message' | 'connection_request' | 'event_invite' | 'donation_thank_you' | 'rsvp_confirmation';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  relatedId?: string;
}

export function NotificationBell() {
  const { user } = useHydratedAuthStore();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.email) {
      fetchNotifications();
      // Poll for new notifications every 30 seconds
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user?.email]);

  const fetchNotifications = async () => {
    if (!user?.email) return;

    try {
      setLoading(true);
      const response = await fetch('/api/notifications', {
        headers: {
          'x-user-email': user.email
        }
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': user?.email || ''
        },
        body: JSON.stringify({
          notificationId,
          isRead: true
        })
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(n =>
            n.id === notificationId ? { ...n, isRead: true } : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleAccept = async (e: React.MouseEvent, notification: Notification) => {
    e.stopPropagation();
    try {
      const response = await fetch('/api/connections', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': user?.email || ''
        },
        body: JSON.stringify({
          requesterId: notification.relatedId,
          status: 'accepted',
          requesterEmail: notification.senderEmail
        })
      });

      if (response.ok) {
        await markAsRead(notification.id);
        alert('Connection accepted! You can now message this user.');
        router.push('/messages');
        setIsOpen(false);
      }
    } catch (error) {
      console.error('Error accepting connection:', error);
    }
  };

  const handleDecline = async (e: React.MouseEvent, notification: Notification) => {
    e.stopPropagation();
    try {
      const response = await fetch('/api/connections', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': user?.email || ''
        },
        body: JSON.stringify({
          requesterId: notification.relatedId,
          status: 'rejected'
        })
      });

      if (response.ok) {
        await markAsRead(notification.id);
      }
    } catch (error) {
      console.error('Error declining connection:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case 'event_invite':
        return <Calendar className="h-4 w-4 text-green-500" />;
      case 'donation_thank_you':
        return <Heart className="h-4 w-4 text-red-500" />;
      case 'connection_request':
        return <Users className="h-4 w-4 text-purple-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (!user) return null;

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <Button
        variant="ghost"
        size="sm"
        className="relative p-2"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Notifications Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 z-50">
          <Card className="shadow-lg border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Notifications</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-4 text-center text-muted-foreground">
                  Loading notifications...
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  No notifications yet
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 border-b last:border-b-0 cursor-pointer hover:bg-gray-50 ${!notification.isRead ? 'bg-blue-50' : ''
                        }`}
                      onClick={() => {
                        if (!notification.isRead) {
                          markAsRead(notification.id);
                        }
                      }}
                    >
                      <div className="flex items-start gap-3">
                        {getNotificationIcon(notification.type)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className={`text-sm font-medium ${!notification.isRead ? 'text-gray-900' : 'text-gray-600'
                              }`}>
                              {notification.title}
                            </p>
                            <span className="text-xs text-muted-foreground">
                              {formatTimeAgo(notification.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            From: {notification.senderName}
                          </p>
                          {notification.type === 'connection_request' && !notification.isRead && (
                            <div className="flex gap-2 mt-2">
                              <Button size="sm" onClick={(e) => handleAccept(e, notification)} className="h-7 text-xs">Accept</Button>
                              <Button size="sm" variant="outline" onClick={(e) => handleDecline(e, notification)} className="h-7 text-xs">Decline</Button>
                            </div>
                          )}
                        </div>
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {notifications.length > 0 && (
                <div className="p-3 border-t bg-gray-50">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-sm"
                    onClick={() => {
                      setIsOpen(false);
                      router.push('/notifications');
                    }}
                  >
                    View All Notifications
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
