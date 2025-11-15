import { NextRequest, NextResponse } from 'next/server';
import { AlumniDataService } from '@/lib/data-service';

interface Notification {
  id: string;
  recipientEmail: string;
  senderEmail: string;
  senderName: string;
  type: 'message' | 'connection_request' | 'event_invite' | 'donation_thank_you' | 'rsvp_confirmation';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  relatedId?: string; // For linking to events, donations, etc.
}

// In-memory storage for the current session (in production, use a database).
// Starts empty so only real notifications created at runtime are shown.
let notifications: Notification[] = [];

export async function GET(request: NextRequest) {
  try {
    const userEmail = request.headers.get('x-user-email');
    
    if (!userEmail) {
      return NextResponse.json({ error: 'User email required' }, { status: 400 });
    }

    // Filter notifications for the current user
    const userNotifications = notifications.filter(n => n.recipientEmail === userEmail);
    
    // Sort by creation date (newest first)
    userNotifications.sort((a: Notification, b: Notification) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const unreadCount = userNotifications.filter(n => !n.isRead).length;

    return NextResponse.json({
      notifications: userNotifications,
      unreadCount,
      total: userNotifications.length
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { recipientEmail, type, title, message, relatedId } = body;
    const senderEmail = request.headers.get('x-user-email');

    if (!recipientEmail || !type || !title || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get sender info from alumni data
    const alumni = AlumniDataService.getAll();
    const sender = alumni.find(a => a.email === senderEmail);
    const senderName = sender ? `${sender.firstName} ${sender.lastName}` : 'SLU Alumni Connect';

    // Create new notification
    const newNotification: Notification = {
      id: `NOT${String(notifications.length + 1).padStart(3, '0')}`,
      recipientEmail,
      senderEmail: senderEmail || 'system@slu.edu',
      senderName,
      type,
      title,
      message,
      isRead: false,
      createdAt: new Date().toISOString(),
      relatedId
    };

    notifications.push(newNotification);

    // In a real app, you would also send an email notification here
    console.log(`📧 Notification sent to ${recipientEmail}: ${title}`);

    return NextResponse.json({ 
      success: true, 
      notification: newNotification 
    });

  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { notificationId, isRead } = body;
    const userEmail = request.headers.get('x-user-email');

    if (!notificationId) {
      return NextResponse.json({ error: 'Notification ID required' }, { status: 400 });
    }

    // Find and update notification
    const notification = notifications.find(n => 
      n.id === notificationId && n.recipientEmail === userEmail
    );

    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    notification.isRead = isRead !== undefined ? isRead : true;

    return NextResponse.json({ 
      success: true, 
      notification 
    });

  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
  }
}
