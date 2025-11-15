import { NextRequest, NextResponse } from 'next/server'
import { emailService, NotificationData } from '@/lib/email-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, recipient, data }: NotificationData = body

    // Validate required fields
    if (!type || !recipient || !recipient.email) {
      return NextResponse.json(
        { error: 'Missing required fields: type, recipient.email' },
        { status: 400 }
      )
    }

    // Send notification
    const success = await emailService.sendNotification({
      type,
      recipient,
      data
    })

    if (success) {
      return NextResponse.json({
        message: 'Notification sent successfully',
        type,
        recipient: recipient.email
      })
    } else {
      return NextResponse.json(
        { error: 'Failed to send notification' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Notification API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Get notification templates (for admin use)
export async function GET() {
  try {
    const templates = [
      {
        type: 'welcome',
        name: 'Welcome Email',
        description: 'Sent to new users when they register'
      },
      {
        type: 'event_reminder',
        name: 'Event Reminder',
        description: 'Sent 24 hours before an event'
      },
      {
        type: 'mentorship_request',
        name: 'Mentorship Request',
        description: 'Sent when someone requests mentorship'
      },
      {
        type: 'donation_receipt',
        name: 'Donation Receipt',
        description: 'Sent after a successful donation'
      },
      {
        type: 'connection_request',
        name: 'Connection Request',
        description: 'Sent when someone wants to connect'
      }
    ]

    return NextResponse.json({ templates })
  } catch (error) {
    console.error('Get templates error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
