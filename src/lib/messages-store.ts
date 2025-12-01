// Persistent messages store for all message-related APIs
// Uses file-based storage for persistence across server restarts

import fs from 'fs';
import path from 'path';

export interface Message {
  id: string
  senderEmail: string
  senderName: string
  receiverEmail: string
  receiverName: string
  subject: string
  content: string
  timestamp: Date | string
  read: boolean
}

const filePath = path.join(process.cwd(), 'src/data', 'messages.json');

// Load messages from file
function loadMessages(): Message[] {
  try {
    // Ensure directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      if (content.trim()) {
        return JSON.parse(content);
      }
    }
  } catch (error) {
    console.error('Error loading messages:', error);
  }
  return getDefaultMessages();
}

// Save messages to file
function saveMessages(messages: Message[]) {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(messages, null, 2));
  } catch (error) {
    console.error('Error saving messages:', error);
  }
}

// Default sample messages
function getDefaultMessages(): Message[] {
  return [
    {
      id: '1',
      senderEmail: 'linda.smith859@email.com',
      senderName: 'Linda Smith',
      receiverEmail: 'donald.davis559@email.com',
      receiverName: 'Donald Davis',
      subject: 'Alumni Event',
      content: 'Hey Donald, are you planning to attend the upcoming alumni networking event in Los Angeles?',
      timestamp: new Date('2024-11-14T10:30:00Z').toISOString(),
      read: false
    },
    {
      id: '2',
      senderEmail: 'donald.davis559@email.com',
      senderName: 'Donald Davis',
      receiverEmail: 'linda.smith859@email.com',
      receiverName: 'Linda Smith',
      subject: 'Re: Alumni Event',
      content: 'Hi Linda! Yes, I\'m definitely planning to attend. It should be a great opportunity to reconnect with fellow alumni. Are you going?',
      timestamp: new Date('2024-11-14T11:15:00Z').toISOString(),
      read: true
    },
    {
      id: '3',
      senderEmail: 'linda.smith859@email.com',
      senderName: 'Linda Smith',
      receiverEmail: 'donald.davis559@email.com',
      receiverName: 'Donald Davis',
      subject: 'Re: Alumni Event',
      content: 'Absolutely! I wouldn\'t miss it. Maybe we can grab coffee beforehand and catch up properly?',
      timestamp: new Date('2024-11-14T12:00:00Z').toISOString(),
      read: false
    }
  ];
}

// Initialize store
let messagesStore: Message[] = loadMessages();

// Export MessagesService class for consistent API
export class MessagesService {
  static getAll(): Message[] {
    messagesStore = loadMessages(); // Reload to get latest
    return messagesStore;
  }

  static getByUser(userEmail: string): Message[] {
    messagesStore = loadMessages();
    const emailLower = userEmail.toLowerCase();
    return messagesStore.filter(msg => 
      msg.senderEmail.toLowerCase() === emailLower || 
      msg.receiverEmail.toLowerCase() === emailLower
    ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  static getById(id: string): Message | undefined {
    messagesStore = loadMessages();
    return messagesStore.find(m => m.id === id);
  }

  static create(message: Omit<Message, 'id' | 'timestamp' | 'read'>): Message {
    messagesStore = loadMessages();
    const newMessage: Message = {
      ...message,
      id: `MSG${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      read: false
    };
    messagesStore.push(newMessage);
    saveMessages(messagesStore);
    return newMessage;
  }

  static markAsRead(messageId: string, userEmail: string): Message | null {
    messagesStore = loadMessages();
    const emailLower = userEmail.toLowerCase();
    const message = messagesStore.find(m => 
      m.id === messageId && m.receiverEmail.toLowerCase() === emailLower
    );
    
    if (message) {
      message.read = true;
      saveMessages(messagesStore);
      return message;
    }
    return null;
  }

  static markAsUnread(messageId: string, userEmail: string): Message | null {
    messagesStore = loadMessages();
    const emailLower = userEmail.toLowerCase();
    const message = messagesStore.find(m => 
      m.id === messageId && m.receiverEmail.toLowerCase() === emailLower
    );
    
    if (message) {
      message.read = false;
      saveMessages(messagesStore);
      return message;
    }
    return null;
  }

  static delete(messageId: string, userEmail: string): boolean {
    messagesStore = loadMessages();
    const emailLower = userEmail.toLowerCase();
    const index = messagesStore.findIndex(m => 
      m.id === messageId && 
      (m.senderEmail.toLowerCase() === emailLower || m.receiverEmail.toLowerCase() === emailLower)
    );
    
    if (index !== -1) {
      messagesStore.splice(index, 1);
      saveMessages(messagesStore);
      return true;
    }
    return false;
  }

  static getReceivedMessages(userEmail: string): Message[] {
    messagesStore = loadMessages();
    const emailLower = userEmail.toLowerCase();
    return messagesStore
      .filter(m => m.receiverEmail.toLowerCase() === emailLower)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  static getSentMessages(userEmail: string): Message[] {
    messagesStore = loadMessages();
    const emailLower = userEmail.toLowerCase();
    return messagesStore
      .filter(m => m.senderEmail.toLowerCase() === emailLower)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  static getUnreadMessages(userEmail: string): Message[] {
    messagesStore = loadMessages();
    const emailLower = userEmail.toLowerCase();
    return messagesStore
      .filter(m => m.receiverEmail.toLowerCase() === emailLower && !m.read)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  static getUnreadCount(userEmail: string): number {
    return this.getUnreadMessages(userEmail).length;
  }
}

// Export for backward compatibility
export { messagesStore };
