"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useHydratedAuthStore } from '@/hooks/use-auth-store';
import { Bell, MessageSquare, Calendar, Heart, Users, Trash2, CheckCircle, RefreshCw } from 'lucide-react';

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

export default function NotificationsPage() {
  const { user } = useHydratedAuthStore();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  useEffect(() => {
    if (user?.email) {
      fetchNotifications();
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
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    const unreadNotifications = notifications.filter(n => !n.isRead);
    
    for (const notification of unreadNotifications) {
      await markAsRead(notification.id);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <MessageSquare className="h-5 w-5 text-blue-500" />;
      case 'event_invite':
        return <Calendar className="h-5 w-5 text-green-500" />;
      case 'donation_thank_you':
        return <Heart className="h-5 w-5 text-red-500" />;
      case 'connection_request':
        return <Users className="h-5 w-5 text-purple-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
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

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.isRead;
    if (filter === 'read') return notification.isRead;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                  <Bell className="h-8 w-8 text-primary" />
                  Notifications
                </h1>
                <p className="text-muted-foreground mt-2">
                  Stay updated with messages, events, and important updates from the SLU alumni community.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={fetchNotifications}
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                {unreadCount > 0 && (
                  <Button onClick={markAllAsRead}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark All Read
                  </Button>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-primary">{notifications.length}</div>
                  <p className="text-sm text-muted-foreground">Total Notifications</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-orange-500">{unreadCount}</div>
                  <p className="text-sm text-muted-foreground">Unread</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-green-500">{notifications.length - unreadCount}</div>
                  <p className="text-sm text-muted-foreground">Read</p>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <div className="flex gap-2 mb-6">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                onClick={() => setFilter('all')}
              >
                All ({notifications.length})
              </Button>
              <Button
                variant={filter === 'unread' ? 'default' : 'outline'}
                onClick={() => setFilter('unread')}
              >
                Unread ({unreadCount})
              </Button>
              <Button
                variant={filter === 'read' ? 'default' : 'outline'}
                onClick={() => setFilter('read')}
              >
                Read ({notifications.length - unreadCount})
              </Button>
            </div>

            {/* Notifications List */}
            {loading ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Loading notifications...</p>
                </CardContent>
              </Card>
            ) : filteredNotifications.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No notifications found</h3>
                  <p className="text-muted-foreground">
                    {filter === 'unread' 
                      ? "You're all caught up! No unread notifications."
                      : filter === 'read'
                      ? "No read notifications yet."
                      : "You don't have any notifications yet."
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredNotifications.map((notification) => (
                  <Card 
                    key={notification.id} 
                    className={`cursor-pointer hover:shadow-md transition-shadow ${
                      !notification.isRead ? 'border-l-4 border-l-blue-500 bg-blue-50/50' : ''
                    }`}
                    onClick={() => {
                      if (!notification.isRead) {
                        markAsRead(notification.id);
                      }
                      // Navigate based on notification type
                      if (notification.type === 'message') {
                        if (notification.relatedId) {
                          router.push(`/messages/${notification.relatedId}`);
                        } else {
                          router.push('/messages');
                        }
                      } else if (notification.type === 'event_invite' || notification.type === 'rsvp_confirmation') {
                        router.push('/events');
                      } else if (notification.type === 'connection_request') {
                        router.push('/directory');
                      } else if (notification.type === 'donation_thank_you') {
                        router.push('/donate');
                      }
                    }}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        {getNotificationIcon(notification.type)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className={`font-semibold ${
                              !notification.isRead ? 'text-gray-900' : 'text-gray-600'
                            }`}>
                              {notification.title}
                            </h3>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">
                                {formatTimeAgo(notification.createdAt)}
                              </span>
                              {!notification.isRead && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              )}
                            </div>
                          </div>
                          <p className="text-muted-foreground mb-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">
                              From: {notification.senderName}
                            </p>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (notification.type === 'message') {
                                  if (notification.relatedId) {
                                    router.push(`/messages/${notification.relatedId}`);
                                  } else {
                                    router.push('/messages');
                                  }
                                } else if (notification.type === 'event_invite' || notification.type === 'rsvp_confirmation') {
                                  router.push('/events');
                                } else if (notification.type === 'connection_request') {
                                  router.push('/directory');
                                } else if (notification.type === 'donation_thank_you') {
                                  router.push('/donate');
                                }
                              }}
                            >
                              {notification.type === 'message' ? 'View Message' : 
                               notification.type === 'event_invite' ? 'View Event' :
                               notification.type === 'rsvp_confirmation' ? 'View Event' :
                               notification.type === 'connection_request' ? 'View Connection' :
                               notification.type === 'donation_thank_you' ? 'View Donation' : 'View'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}
