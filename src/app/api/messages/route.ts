import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-utils";
import { AlumniDataService } from "@/lib/data-service";
import { messagesStore } from "@/lib/messages-store";
import { registeredUsers } from "@/lib/registered-users";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userEmailLower = user.email.toLowerCase()

    // Return messages for the current user
    const userMessages = messagesStore.filter(msg => 
      msg.senderEmail.toLowerCase() === userEmailLower || 
      msg.receiverEmail.toLowerCase() === userEmailLower
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

    const receiverEmailLower = receiverEmail.toLowerCase()

    // Get receiver's name from multiple sources
    let receiverName = "Unknown User"
    let senderName = `${user.profile?.firstName || 'User'} ${user.profile?.lastName || ''}`.trim()
    
    // Check registered users first
    if (registeredUsers.has(receiverEmailLower)) {
      const userData = registeredUsers.get(receiverEmailLower)
      receiverName = `${userData!.user.profile.firstName} ${userData!.user.profile.lastName}`
    } else if (receiverEmailLower === 'admin@slu.edu') {
      receiverName = "Admin User"
    } else {
      // Check CSV data
      const alumni = AlumniDataService.getAll()
      const receiver = alumni.find(a => a.email.toLowerCase() === receiverEmailLower)
      if (receiver) {
        receiverName = `${receiver.firstName} ${receiver.lastName}`
      }
    }

    const newMessage = {
      id: Date.now().toString(),
      senderEmail: user.email,
      senderName: senderName || user.email,
      receiverEmail,
      receiverName,
      subject: subject || "New Message",
      content,
      timestamp: new Date(),
      read: false
    };

    messagesStore.push(newMessage);

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

    const userEmailLower = user.email.toLowerCase()

    const message = messagesStore.find(m => 
      m.id === messageId && m.receiverEmail.toLowerCase() === userEmailLower
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
