"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useHydratedAuthStore } from '@/hooks/use-auth-store';
import { ArrowLeft, Send, MessageSquare, Phone, Video, MoreVertical } from 'lucide-react';

interface Message {
  id: string;
  senderEmail: string;
  senderName: string;
  receiverEmail: string;
  receiverName: string;
  subject: string;
  content: string;
  timestamp: Date;
  read: boolean;
}

interface ChatMessage {
  id: string;
  content: string;
  senderEmail: string;
  senderName: string;
  timestamp: Date;
  isMe: boolean;
}

export default function MessageThreadPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useHydratedAuthStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [otherParticipant, setOtherParticipant] = useState<{email: string, name: string} | null>(null);

  useEffect(() => {
    if (user?.email && params.id) {
      fetchMessageThread();
    }
  }, [user?.email, params.id]);

  const fetchMessageThread = async () => {
    if (!user?.email) {
      console.warn('No user email available');
      return;
    }

    try {
      setLoading(true);
      const rawId: string | string[] | undefined = (params as any).id;
      const messageId = Array.isArray(rawId) ? rawId[0] : rawId;

      console.log('Fetching thread for message ID:', messageId);

      if (!messageId) {
        console.error('No message id found in route params');
        router.push('/messages');
        return;
      }

      // Use the dedicated thread API endpoint
      const response = await fetch(`/api/messages/${messageId}`, {
        headers: {
          'x-user-email': user.email
        }
      });

      console.log('Thread API response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Failed to fetch message thread:', {
          status: response.status,
          statusText: response.statusText,
          errorData,
          messageId,
          userEmail: user.email
        });
        // Don't redirect immediately, show error state
        setOtherParticipant(null);
        setMessages([]);
        return;
      }

      const data = await response.json();
      console.log('Thread data received:', data);
      
      if (data.success) {
        // Set other participant info
        setOtherParticipant(data.otherParticipant);

        // Convert messages to chat format
        const chatMessages: ChatMessage[] = (data.messages || []).map((msg: Message) => ({
          id: msg.id,
          content: msg.content,
          senderEmail: msg.senderEmail,
          senderName: msg.senderName,
          timestamp: new Date(msg.timestamp),
          isMe: msg.senderEmail.toLowerCase() === user.email.toLowerCase()
        }));

        console.log('Converted to chat messages:', chatMessages.length, 'messages');
        setMessages(chatMessages);
      } else {
        console.error('Invalid response from thread API - success=false');
        setOtherParticipant(null);
        setMessages([]);
      }
    } catch (error) {
      console.error('Error fetching message thread:', error);
      setOtherParticipant(null);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !otherParticipant || !user?.email) return;

    setSending(true);
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': user.email
        },
        body: JSON.stringify({
          receiverEmail: otherParticipant.email,
          subject: 'Re: Conversation',
          content: newMessage.trim()
        })
      });

      if (response.ok) {
        // Add message to local state immediately
        const newChatMessage: ChatMessage = {
          id: Date.now().toString(),
          content: newMessage.trim(),
          senderEmail: user.email,
          senderName: user.profile?.firstName + ' ' + user.profile?.lastName || user.email,
          timestamp: new Date(),
          isMe: true
        };
        
        setMessages(prev => [...prev, newChatMessage]);
        setNewMessage('');
        
        // Refresh to get the actual message from server
        setTimeout(fetchMessageThread, 1000);
      } else {
        alert('Failed to send message. Please try again.');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error sending message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const messageDate = new Date(date);
    const diffInMinutes = Math.floor((now.getTime() - messageDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    
    // Show date if more than a day
    return messageDate.toLocaleDateString();
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <MainLayout>
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading conversation...</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </MainLayout>
      </ProtectedRoute>
    );
  }

  // Show error state if no participant or no messages
  if (!loading && !otherParticipant) {
    return (
      <ProtectedRoute>
        <MainLayout>
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
              <Card>
                <CardContent className="p-8 text-center">
                  <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Unable to Load Conversation</h3>
                  <p className="text-muted-foreground mb-4">
                    This conversation could not be found or you don't have access to it.
                  </p>
                  <Button onClick={() => router.push('/messages')}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Messages
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </MainLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="container mx-auto px-4 py-4">
          <div className="max-w-4xl mx-auto h-[calc(100vh-120px)] flex flex-col">
            
            {/* Chat Header */}
            <Card className="mb-4">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push('/messages')}
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Messages
                    </Button>
                    {otherParticipant && (
                      <>
                        <Avatar className="w-10 h-10">
                          <div className="w-full h-full bg-primary flex items-center justify-center text-white font-bold text-sm">
                            {getInitials(otherParticipant.name)}
                          </div>
                        </Avatar>
                        <div>
                          <h2 className="font-semibold">{otherParticipant.name}</h2>
                          <p className="text-sm text-muted-foreground">{otherParticipant.email}</p>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {messages.length} message{messages.length !== 1 ? 's' : ''}
                    </Badge>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Messages Area */}
            <Card className="flex-1 flex flex-col">
              <CardContent className="flex-1 p-4 overflow-y-auto">
                {messages.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No messages yet</h3>
                    <p className="text-muted-foreground">Start the conversation by sending a message below.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message, index) => (
                      <div
                        key={message.id}
                        className={`flex ${message.isMe ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[70%] ${message.isMe ? 'order-2' : 'order-1'}`}>
                          <div
                            className={`rounded-lg px-4 py-2 ${
                              message.isMe
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          </div>
                          <div className={`flex items-center gap-2 mt-1 text-xs text-muted-foreground ${
                            message.isMe ? 'justify-end' : 'justify-start'
                          }`}>
                            <span>{message.isMe ? 'You' : message.senderName}</span>
                            <span>•</span>
                            <span>{formatTime(message.timestamp)}</span>
                          </div>
                        </div>
                        {!message.isMe && (
                          <Avatar className="w-8 h-8 order-1 mr-2">
                            <div className="w-full h-full bg-secondary flex items-center justify-center text-xs font-bold">
                              {getInitials(message.senderName)}
                            </div>
                          </Avatar>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>

              {/* Message Input */}
              <div className="border-t p-4">
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <textarea
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      rows={1}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring min-h-[40px] max-h-[120px]"
                      style={{ height: 'auto' }}
                      onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = 'auto';
                        target.style.height = target.scrollHeight + 'px';
                      }}
                    />
                  </div>
                  <Button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || sending}
                    size="sm"
                    className="px-4"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Press Enter to send, Shift+Enter for new line
                </p>
              </div>
            </Card>
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}
