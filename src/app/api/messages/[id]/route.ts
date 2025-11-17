import { NextRequest, NextResponse } from 'next/server';
import { messagesStore } from '@/lib/messages-store';

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
    
    const userEmailLower = userEmail.toLowerCase();
    
    // Find the specific message
    const targetMessage = messagesStore.find(m => m.id === messageId);
    
    if (!targetMessage) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Get the other participant
    const otherParticipantEmail = targetMessage.senderEmail.toLowerCase() === userEmailLower
      ? targetMessage.receiverEmail 
      : targetMessage.senderEmail;

    // Find all messages in this conversation thread
    const threadMessages = messagesStore.filter(message => 
      (message.senderEmail.toLowerCase() === userEmailLower && message.receiverEmail.toLowerCase() === otherParticipantEmail.toLowerCase()) ||
      (message.senderEmail.toLowerCase() === otherParticipantEmail.toLowerCase() && message.receiverEmail.toLowerCase() === userEmailLower)
    );

    // Sort by timestamp
    threadMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    // Mark unread messages as read
    threadMessages.forEach(msg => {
      if (msg.receiverEmail.toLowerCase() === userEmailLower && !msg.read) {
        msg.read = true;
      }
    });

    return NextResponse.json({
      success: true,
      messages: threadMessages,
      otherParticipant: {
        email: otherParticipantEmail,
        name: targetMessage.senderEmail.toLowerCase() === userEmailLower
          ? targetMessage.receiverName 
          : targetMessage.senderName
      }
    });

  } catch (error) {
    console.error('Error fetching message thread:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
