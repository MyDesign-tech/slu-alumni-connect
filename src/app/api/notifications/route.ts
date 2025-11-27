import { NextRequest, NextResponse } from 'next/server';
import { NotificationService } from '@/lib/notification-service';

export async function GET(request: NextRequest) {
  try {
    const userEmail = request.headers.get('x-user-email');

    if (!userEmail) {
      return NextResponse.json({ error: 'User email required' }, { status: 400 });
    }

    const notifications = NotificationService.getAll(userEmail);
    const unreadCount = NotificationService.getUnreadCount(userEmail);

    return NextResponse.json({
      notifications,
      unreadCount,
      total: notifications.length
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { recipientEmail, type, title, message, relatedId, emailData } = body;
    const senderEmail = request.headers.get('x-user-email');

    if (!recipientEmail || !type || !title || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const notification = await NotificationService.create({
      recipientEmail,
      senderEmail: senderEmail || undefined,
      type,
      title,
      message,
      relatedId,
      sendEmail: true, // Default to sending email
      emailData
    });

    return NextResponse.json({
      success: true,
      notification
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

    if (isRead) {
      const success = NotificationService.markAsRead(notificationId, userEmail || '');
      if (!success) {
        return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
      }
    }

    return NextResponse.json({
      success: true
    });

  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
  }
}
