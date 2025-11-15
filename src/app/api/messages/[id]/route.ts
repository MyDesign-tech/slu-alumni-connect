import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for demo purposes
let messages = [
  {
    id: '1',
    senderEmail: 'linda.smith859@email.com',
    senderName: 'Linda Smith',
    receiverEmail: 'donald.davis559@email.com',
    receiverName: 'Donald Davis',
    subject: 'Alumni Event',
    content: 'Hey Linda, are you planning to attend the upcoming alumni networking event in Los Angeles?',
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
    content: 'Hi Donald! Yes, I\'m definitely planning to attend. It should be a great opportunity to reconnect with fellow alumni. Are you going?',
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
];

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: messageId } = await context.params;
    const userEmail = request.headers.get('x-user-email');
    
    if (!userEmail) {
      return NextResponse.json({ error: 'User email required' }, { status: 401 });
    }
    
    // Find the specific message
    const targetMessage = messages.find(m => m.id === messageId);
    
    if (!targetMessage) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Get the other participant
    const otherParticipantEmail = targetMessage.senderEmail === userEmail 
      ? targetMessage.receiverEmail 
      : targetMessage.senderEmail;

    // Find all messages in this conversation thread
    const threadMessages = messages.filter(message => 
      (message.senderEmail === userEmail && message.receiverEmail === otherParticipantEmail) ||
      (message.senderEmail === otherParticipantEmail && message.receiverEmail === userEmail)
    );

    // Sort by timestamp
    threadMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    return NextResponse.json({
      success: true,
      messages: threadMessages,
      otherParticipant: {
        email: otherParticipantEmail,
        name: targetMessage.senderEmail === userEmail 
          ? targetMessage.receiverName 
          : targetMessage.senderName
      }
    });

  } catch (error) {
    console.error('Error fetching message thread:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
