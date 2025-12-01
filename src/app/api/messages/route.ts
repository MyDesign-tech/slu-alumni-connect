import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-utils";
import { AlumniDataService } from "@/lib/data-service";
import { MessagesService } from "@/lib/messages-store";
import { registeredUsers } from "@/lib/registered-users";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Return messages for the current user using the service
    const userMessages = MessagesService.getByUser(user.email);

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

    // Create the message using MessagesService
    const newMessage = MessagesService.create({
      senderEmail: user.email,
      senderName: senderName || user.email,
      receiverEmail,
      receiverName,
      subject: subject || "New Message",
      content
    });

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

    let message;
    if (read === false) {
      message = MessagesService.markAsUnread(messageId, user.email);
    } else {
      message = MessagesService.markAsRead(messageId, user.email);
    }

    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    return NextResponse.json({ 
      message: "Message updated successfully", 
      messageData: message 
    });
  } catch (error) {
    console.error("Update message error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Delete message
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get('messageId');

    if (!messageId) {
      return NextResponse.json({ error: "Message ID required" }, { status: 400 });
    }

    const deleted = MessagesService.delete(messageId, user.email);

    if (!deleted) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Message deleted successfully" });
  } catch (error) {
    console.error("Delete message error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
