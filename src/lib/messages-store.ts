// Shared messages store for all message-related APIs
// In production, this would be replaced with database storage

export interface Message {
  id: string
  senderEmail: string
  senderName: string
  receiverEmail: string
  receiverName: string
  subject: string
  content: string
  timestamp: Date
  read: boolean
}

// In-memory storage for messages
export const messagesStore: Message[] = [
  {
    id: '1',
    senderEmail: 'linda.smith859@email.com',
    senderName: 'Linda Smith',
    receiverEmail: 'donald.davis559@email.com',
    receiverName: 'Donald Davis',
    subject: 'Alumni Event',
    content: 'Hey Donald, are you planning to attend the upcoming alumni networking event in Los Angeles?',
    timestamp: new Date('2024-11-14T10:30:00Z'),
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
    timestamp: new Date('2024-11-14T11:15:00Z'),
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
    timestamp: new Date('2024-11-14T12:00:00Z'),
    read: false
  }
]
