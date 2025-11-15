"use client";

import { useState } from 'react';
import { MessageSquare, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SendMessageDialog } from './send-message-dialog';

export function MessageFAB() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <SendMessageDialog
        trigger={
          <Button
            size="lg"
            className="rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-shadow"
          >
            <MessageSquare className="h-6 w-6" />
          </Button>
        }
      />
    </div>
  );
}
