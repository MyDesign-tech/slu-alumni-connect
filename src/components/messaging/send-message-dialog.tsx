"use client";

import { useState } from 'react';
import { Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useHydratedAuthStore } from '@/hooks/use-auth-store';

interface SendMessageDialogProps {
  recipientEmail?: string;
  recipientName?: string;
  trigger?: React.ReactNode;
}

export function SendMessageDialog({ recipientEmail, recipientName, trigger }: SendMessageDialogProps) {
  const { user } = useHydratedAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [selectedRecipient, setSelectedRecipient] = useState(recipientEmail || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!content.trim() || !user?.email) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': user.email
        },
        body: JSON.stringify({
          receiverEmail: selectedRecipient,
          subject: subject.trim() || 'New Message',
          content: content.trim()
        })
      });

      if (response.ok) {
        setSubject('');
        setContent('');
        setIsOpen(false);
        alert(`Message sent to ${recipientName || selectedRecipient}!`);
      } else {
        alert('Failed to send message. Please try again.');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error sending message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const defaultTrigger = (
    <Button size="sm" className="flex items-center gap-2">
      <Send className="h-4 w-4" />
      Send Message
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            {recipientName ? `Send Message to ${recipientName}` : 'Compose New Message'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {!recipientEmail && (
            <div>
              <label className="text-sm font-medium mb-2 block">To</label>
              <Input
                placeholder="Enter recipient email..."
                value={selectedRecipient}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSelectedRecipient(e.target.value)}
              />
            </div>
          )}
          <div>
            <label className="text-sm font-medium mb-2 block">Subject</label>
            <Input
              placeholder="Enter message subject..."
              value={subject}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSubject(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Message</label>
            <textarea
              placeholder="Type your message here..."
              value={content}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value)}
              rows={6}
              className="w-full px-3 py-2 border border-input rounded-md bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              disabled={!content.trim() || !selectedRecipient.trim() || isLoading}
              className="flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              {isLoading ? 'Sending...' : 'Send Message'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
