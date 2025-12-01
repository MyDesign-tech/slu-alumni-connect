"use client";

import { useState, useEffect } from 'react';
import { Send, X, Check, Loader2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useHydratedAuthStore } from '@/hooks/use-auth-store';

interface SendMessageDialogProps {
  recipientEmail?: string;
  recipientName?: string;
  trigger?: React.ReactNode;
  onMessageSent?: () => void;
}

interface AlumniOption {
  email: string;
  name: string;
  jobTitle?: string;
}

export function SendMessageDialog({ recipientEmail, recipientName, trigger, onMessageSent }: SendMessageDialogProps) {
  const { user } = useHydratedAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [selectedRecipient, setSelectedRecipient] = useState(recipientEmail || '');
  const [selectedRecipientName, setSelectedRecipientName] = useState(recipientName || '');
  const [isLoading, setIsLoading] = useState(false);
  const [messageSent, setMessageSent] = useState(false);
  const [error, setError] = useState('');
  
  // For recipient search
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [alumniOptions, setAlumniOptions] = useState<AlumniOption[]>([]);
  const [loadingAlumni, setLoadingAlumni] = useState(false);

  // Reset states when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSelectedRecipient(recipientEmail || '');
      setSelectedRecipientName(recipientName || '');
      setSubject('');
      setContent('');
      setMessageSent(false);
      setError('');
      setShowSearch(!recipientEmail);
    }
  }, [isOpen, recipientEmail, recipientName]);

  // Fetch alumni for search
  useEffect(() => {
    const fetchAlumni = async () => {
      if (!showSearch) return;
      
      setLoadingAlumni(true);
      try {
        const response = await fetch('/api/directory');
        if (response.ok) {
          const data = await response.json();
          const options = data.alumni?.map((a: any) => ({
            email: a.email,
            name: `${a.firstName} ${a.lastName}`,
            jobTitle: a.jobTitle
          })) || [];
          setAlumniOptions(options);
        }
      } catch (error) {
        console.error('Error fetching alumni:', error);
      } finally {
        setLoadingAlumni(false);
      }
    };

    if (isOpen && showSearch) {
      fetchAlumni();
    }
  }, [isOpen, showSearch]);

  const filteredAlumni = alumniOptions.filter(a => 
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (a.jobTitle && a.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()))
  ).slice(0, 5);

  const handleSelectRecipient = (alumni: AlumniOption) => {
    setSelectedRecipient(alumni.email);
    setSelectedRecipientName(alumni.name);
    setSearchQuery('');
    setShowSearch(false);
  };

  const handleSend = async () => {
    if (!content.trim() || !user?.email || !selectedRecipient.trim()) return;

    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': user.email
        },
        body: JSON.stringify({
          receiverEmail: selectedRecipient.trim(),
          subject: subject.trim() || 'New Message',
          content: content.trim()
        })
      });

      if (response.ok) {
        setMessageSent(true);
        
        // Dispatch event to refresh messages in the parent component
        window.dispatchEvent(new CustomEvent('message-sent'));
        
        // Call the callback if provided
        if (onMessageSent) {
          onMessageSent();
        }
        
        // Close dialog after a short delay to show success
        setTimeout(() => {
          setSubject('');
          setContent('');
          setMessageSent(false);
          setIsOpen(false);
        }, 1500);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to send message. Please try again.');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Error sending message. Please try again.');
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
            {selectedRecipientName ? `Send Message to ${selectedRecipientName}` : 'Compose New Message'}
          </DialogTitle>
        </DialogHeader>
        
        {messageSent ? (
          <div className="py-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-green-600 mb-2">Message Sent!</h3>
            <p className="text-sm text-muted-foreground">
              Your message to {selectedRecipientName || selectedRecipient} was sent successfully.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {error}
              </div>
            )}
            
            {/* Recipient Selection */}
            {!recipientEmail && (
              <div>
                <label className="text-sm font-medium mb-2 block">To</label>
                {selectedRecipient && !showSearch ? (
                  <div className="flex items-center justify-between p-2 border rounded-md bg-muted/30">
                    <div>
                      <span className="font-medium">{selectedRecipientName || selectedRecipient}</span>
                      {selectedRecipientName && (
                        <span className="text-xs text-muted-foreground ml-2">({selectedRecipient})</span>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedRecipient('');
                        setSelectedRecipientName('');
                        setShowSearch(true);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search alumni by name or email..."
                      value={searchQuery}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                    
                    {/* Search Results Dropdown */}
                    {searchQuery && (
                      <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-48 overflow-auto">
                        {loadingAlumni ? (
                          <div className="p-3 text-center text-muted-foreground text-sm">
                            <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                          </div>
                        ) : filteredAlumni.length > 0 ? (
                          filteredAlumni.map((alumni) => (
                            <button
                              key={alumni.email}
                              className="w-full p-3 text-left hover:bg-muted/50 border-b last:border-0"
                              onClick={() => handleSelectRecipient(alumni)}
                            >
                              <div className="font-medium text-sm">{alumni.name}</div>
                              <div className="text-xs text-muted-foreground">{alumni.email}</div>
                              {alumni.jobTitle && (
                                <div className="text-xs text-muted-foreground">{alumni.jobTitle}</div>
                              )}
                            </button>
                          ))
                        ) : (
                          <div className="p-3 text-center text-muted-foreground text-sm">
                            No results found. You can also enter an email directly.
                            <Button
                              variant="link"
                              size="sm"
                              className="block mt-2 mx-auto"
                              onClick={() => {
                                setSelectedRecipient(searchQuery);
                                setSelectedRecipientName('');
                                setSearchQuery('');
                                setShowSearch(false);
                              }}
                            >
                              Use "{searchQuery}" as email
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
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
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Send Message
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
