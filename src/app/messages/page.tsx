"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useHydratedAuthStore } from '@/hooks/use-auth-store';
import { SendMessageDialog } from '@/components/messaging/send-message-dialog';
import { MessageSquare, Send, Search, Inbox, SendHorizontal, Archive, RefreshCw, Reply, Trash2, CheckCircle, Users } from 'lucide-react';

interface Message {
  id: string;
  senderEmail: string;
  senderName: string;
  receiverEmail: string;
  receiverName: string;
  subject: string;
  content: string;
  timestamp: Date | string;
  read: boolean;
}

export default function MessagesPage() {
  const { user } = useHydratedAuthStore();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'received' | 'sent' | 'unread'>('all');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showMessageDialog, setShowMessageDialog] = useState(false);

  const [connections, setConnections] = useState<any[]>([]);

  const fetchMessages = useCallback(async () => {
    if (!user?.email) return;

    try {
      setLoading(true);
      const response = await fetch('/api/messages', {
        headers: {
          'x-user-email': user.email
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  const fetchConnections = useCallback(async () => {
    if (!user?.email) return;
    
    try {
      const response = await fetch('/api/connections', {
        headers: {
          'x-user-email': user.email
        }
      });
      if (response.ok) {
        const data = await response.json();
        const accepted = data.connections.filter((c: any) => c.status === 'accepted');
        setConnections(accepted);
      }
    } catch (error) {
      console.error('Error fetching connections:', error);
    }
  }, [user?.email]);

  useEffect(() => {
    if (user?.email) {
      fetchMessages();
      fetchConnections();
    }
  }, [user?.email, fetchMessages, fetchConnections]);

  // Listen for message-sent event to refresh messages
  useEffect(() => {
    const handleMessageSent = () => {
      fetchMessages();
    };

    window.addEventListener('message-sent', handleMessageSent);
    return () => {
      window.removeEventListener('message-sent', handleMessageSent);
    };
  }, [fetchMessages]);

  const markAsRead = async (messageId: string) => {
    if (!user?.email) return;
    
    try {
      const response = await fetch('/api/messages', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': user.email
        },
        body: JSON.stringify({
          messageId,
          read: true
        })
      });

      if (response.ok) {
        setMessages(prev =>
          prev.map(m =>
            m.id === messageId ? { ...m, read: true } : m
          )
        );
      }
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (!user?.email) return;
    
    if (!confirm('Are you sure you want to delete this message?')) return;
    
    try {
      const response = await fetch(`/api/messages?messageId=${messageId}`, {
        method: 'DELETE',
        headers: {
          'x-user-email': user.email
        }
      });

      if (response.ok) {
        setMessages(prev => prev.filter(m => m.id !== messageId));
      }
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const formatTimeAgo = (date: Date | string) => {
    const now = new Date();
    const msgDate = new Date(date);
    const diffInMinutes = Math.floor((now.getTime() - msgDate.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`;
    return msgDate.toLocaleDateString();
  };

  const filteredMessages = messages.filter(message => {
    const matchesSearch =
      message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.senderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.receiverName.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    const userEmail = user?.email?.toLowerCase();
    
    switch (filter) {
      case 'received':
        return message.receiverEmail.toLowerCase() === userEmail;
      case 'sent':
        return message.senderEmail.toLowerCase() === userEmail;
      case 'unread':
        return message.receiverEmail.toLowerCase() === userEmail && !message.read;
      default:
        return true;
    }
  });

  const receivedMessages = messages.filter(m => m.receiverEmail.toLowerCase() === user?.email?.toLowerCase());
  const sentMessages = messages.filter(m => m.senderEmail.toLowerCase() === user?.email?.toLowerCase());
  const unreadMessages = receivedMessages.filter(m => !m.read);

  const handleMessageClick = (message: Message) => {
    // Navigate to message thread page
    router.push(`/messages/${message.id}`);

    // Mark as read if it's a received message and unread
    if (message.receiverEmail.toLowerCase() === user?.email?.toLowerCase() && !message.read) {
      markAsRead(message.id);
    }
  };

  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                  <MessageSquare className="h-8 w-8 text-primary" />
                  Messages
                </h1>
                <p className="text-muted-foreground mt-2">
                  Connect and communicate with fellow SLU alumni.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={fetchMessages}
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <SendMessageDialog
                  recipientEmail=""
                  recipientName=""
                  onMessageSent={fetchMessages}
                  trigger={
                    <Button>
                      <Send className="h-4 w-4 mr-2" />
                      New Message
                    </Button>
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-primary">{messages.length}</div>
                      <p className="text-sm text-muted-foreground">Total Messages</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-blue-500">{receivedMessages.length}</div>
                      <p className="text-sm text-muted-foreground">Received</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-green-500">{sentMessages.length}</div>
                      <p className="text-sm text-muted-foreground">Sent</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-orange-500">{unreadMessages.length}</div>
                      <p className="text-sm text-muted-foreground">Unread</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Search and Filters */}
                <Card className="mb-6">
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="flex-1">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search messages by subject, content, or sender..."
                            value={searchTerm}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant={filter === 'all' ? 'default' : 'outline'}
                          onClick={() => setFilter('all')}
                          size="sm"
                        >
                          <Inbox className="h-4 w-4 mr-1" />
                          All ({messages.length})
                        </Button>
                        <Button
                          variant={filter === 'received' ? 'default' : 'outline'}
                          onClick={() => setFilter('received')}
                          size="sm"
                        >
                          <Inbox className="h-4 w-4 mr-1" />
                          Received ({receivedMessages.length})
                        </Button>
                        <Button
                          variant={filter === 'sent' ? 'default' : 'outline'}
                          onClick={() => setFilter('sent')}
                          size="sm"
                        >
                          <SendHorizontal className="h-4 w-4 mr-1" />
                          Sent ({sentMessages.length})
                        </Button>
                        <Button
                          variant={filter === 'unread' ? 'default' : 'outline'}
                          onClick={() => setFilter('unread')}
                          size="sm"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Unread ({unreadMessages.length})
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Messages List */}
                {loading ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">Loading messages...</p>
                    </CardContent>
                  </Card>
                ) : filteredMessages.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold mb-2">No messages found</h3>
                      <p className="text-muted-foreground mb-4">
                        {searchTerm
                          ? `No messages match your search "${searchTerm}"`
                          : filter === 'unread'
                            ? "You're all caught up! No unread messages."
                            : "Start connecting with fellow alumni by sending your first message."
                        }
                      </p>
                      <SendMessageDialog
                        recipientEmail=""
                        recipientName=""
                        onMessageSent={fetchMessages}
                        trigger={
                          <Button>
                            <Send className="h-4 w-4 mr-2" />
                            Send Your First Message
                          </Button>
                        }
                      />
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-2">
                    {filteredMessages.map((message) => {
                      const isReceived = message.receiverEmail === user?.email;
                      const isUnread = isReceived && !message.read;

                      return (
                        <Card
                          key={message.id}
                          className={`cursor-pointer hover:shadow-md transition-shadow ${isUnread ? 'border-l-4 border-l-blue-500 bg-blue-50/50' : ''
                            }`}
                          onClick={() => handleMessageClick(message)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 flex-1 min-w-0" onClick={() => handleMessageClick(message)}>
                                <div className="shrink-0">
                                  {isReceived ? (
                                    <Inbox className="h-5 w-5 text-blue-500" />
                                  ) : (
                                    <SendHorizontal className="h-5 w-5 text-green-500" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className={`font-medium truncate ${isUnread ? 'text-gray-900' : 'text-gray-600'
                                      }`}>
                                      {isReceived ? message.senderName : message.receiverName}
                                    </span>
                                    {isUnread && (
                                      <Badge variant="secondary" className="text-xs">New</Badge>
                                    )}
                                  </div>
                                  <p className={`text-sm truncate ${isUnread ? 'font-semibold text-gray-900' : 'text-gray-600'
                                    }`}>
                                    {message.subject}
                                  </p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {message.content}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <div className="flex flex-col items-end gap-1">
                                  <span className="text-xs text-muted-foreground">
                                    {formatTimeAgo(message.timestamp)}
                                  </span>
                                  <div className="flex items-center gap-1">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 px-2 text-xs"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        router.push(`/messages/${message.id}`);
                                      }}
                                    >
                                      <MessageSquare className="h-3 w-3 mr-1" />
                                      Chat
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 px-2 text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        deleteMessage(message.id);
                                      }}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                    {isUnread && (
                                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      My Connections
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {connections.length === 0 ? (
                      <div className="text-center py-4">
                        <p className="text-sm text-muted-foreground mb-2">No connections yet.</p>
                        <Button
                          variant="link"
                          size="sm"
                          onClick={() => router.push('/directory')}
                        >
                          Find Alumni →
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {connections.map(c => (
                          <div key={c.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-2 overflow-hidden">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs shrink-0">
                                {c.profile?.firstName?.[0]}{c.profile?.lastName?.[0]}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate">{c.profile?.firstName} {c.profile?.lastName}</p>
                                <p className="text-xs text-muted-foreground truncate">{c.profile?.jobTitle}</p>
                              </div>
                            </div>
                            <SendMessageDialog
                              recipientEmail={c.profile?.email}
                              recipientName={`${c.profile?.firstName} ${c.profile?.lastName}`}
                              onMessageSent={fetchMessages}
                              trigger={
                                <Button size="icon" variant="ghost" className="h-8 w-8">
                                  <MessageSquare className="h-4 w-4" />
                                </Button>
                              }
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Message Detail Dialog */}
            <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
              <DialogContent className="max-w-2xl">
                {selectedMessage && (
                  <>
                    <DialogHeader>
                      <DialogTitle className="flex items-center justify-between">
                        <span>{selectedMessage.subject}</span>
                        <div className="flex items-center gap-2">
                          {selectedMessage.receiverEmail === user?.email && (
                            <SendMessageDialog
                              recipientEmail={selectedMessage.senderEmail}
                              recipientName={selectedMessage.senderName}
                              trigger={
                                <Button size="sm" variant="outline">
                                  <Reply className="h-4 w-4 mr-1" />
                                  Reply
                                </Button>
                              }
                            />
                          )}
                        </div>
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-sm text-muted-foreground border-b pb-4">
                        <div>
                          <p><strong>From:</strong> {selectedMessage.senderName} ({selectedMessage.senderEmail})</p>
                          <p><strong>To:</strong> {selectedMessage.receiverName} ({selectedMessage.receiverEmail})</p>
                        </div>
                        <p>{new Date(selectedMessage.timestamp).toLocaleString()}</p>
                      </div>
                      <div className="prose max-w-none">
                        <p className="whitespace-pre-wrap">{selectedMessage.content}</p>
                      </div>
                    </div>
                  </>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}
