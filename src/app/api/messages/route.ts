import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-utils";
import { AlumniDataService } from "@/lib/data-service";

// In-memory messages for the current session (in production, use a database).
// Starts empty so only real messages sent while the app is running are shown.
let messages: any[] = [];

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Return messages for the current user
    const userMessages = messages.filter(msg => 
      msg.senderEmail === user.email || msg.receiverEmail === user.email
    );
    
    // Sort by timestamp (newest first)
    userMessages.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({ messages: userMessages });
  } catch (error) {
    console.error("Messages API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { receiverEmail, subject, content } = body;

    if (!receiverEmail || !content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Get alumni data to find receiver info
    const alumni = AlumniDataService.getAll();
    const receiver = alumni.find(a => a.email === receiverEmail);
    const sender = alumni.find(a => a.email === user.email);
    
    if (!receiver) {
      return NextResponse.json({ error: "Recipient not found" }, { status: 404 });
    }

    const newMessage = {
      id: (messages.length + 1).toString(),
      senderEmail: user.email,
      senderName: sender ? `${sender.firstName} ${sender.lastName}` : user.email,
      receiverEmail,
      receiverName: `${receiver.firstName} ${receiver.lastName}`,
      subject: subject || "New Message",
      content,
      timestamp: new Date(),
      read: false
    };

    messages.push(newMessage);

    // Create notification for the recipient
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': user.email
        },
        body: JSON.stringify({
          recipientEmail: receiverEmail,
          type: 'message',
          title: `New message from ${newMessage.senderName}`,
          message: `Subject: ${newMessage.subject}`,
          relatedId: newMessage.id
        })
      });
    } catch (notificationError) {
      console.error('Failed to send notification:', notificationError);
      // Don't fail the message sending if notification fails
    }

    return NextResponse.json({ 
      message: "Message sent successfully", 
      messageData: newMessage 
    }, { status: 201 });
  } catch (error) {
    console.error("Send message error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Mark message as read
export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { messageId, read } = body;

    const message = messages.find(m => 
      m.id === messageId && m.receiverEmail === user.email
    );

    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    message.read = read !== undefined ? read : true;

    return NextResponse.json({ 
      message: "Message updated successfully", 
      messageData: message 
    });
  } catch (error) {
    console.error("Update message error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
