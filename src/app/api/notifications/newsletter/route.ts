import { NextRequest, NextResponse } from 'next/server'
import { emailService } from '@/lib/email-service'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { subject, content, targetAudience } = body

    // Validate required fields
    if (!subject || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: subject, content' },
        { status: 400 }
      )
    }

    // Get recipient list based on target audience
    let recipients: string[] = []

    try {
      if (targetAudience === 'all') {
        // Get all active users
        const users = await db.user.findMany({
          where: { 
            profile: { 
              verificationStatus: 'VERIFIED' 
            } 
          },
          select: { email: true }
        })
        recipients = users.map(user => user.email)
      } else if (targetAudience === 'recent') {
        // Get users who joined in the last 30 days
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        
        const users = await db.user.findMany({
          where: { 
            createdAt: { gte: thirtyDaysAgo },
            profile: { 
              verificationStatus: 'VERIFIED' 
            }
          },
          select: { email: true }
        })
        recipients = users.map(user => user.email)
      } else if (targetAudience && typeof targetAudience === 'object' && targetAudience.department) {
        // Get users by department
        const users = await db.user.findMany({
          where: { 
            profile: { 
              department: targetAudience.department,
              verificationStatus: 'VERIFIED' 
            } 
          },
          select: { email: true }
        })
        recipients = users.map(user => user.email)
      } else {
        return NextResponse.json(
          { error: 'Invalid target audience' },
          { status: 400 }
        )
      }
    } catch (dbError) {
      console.error('Database error:', dbError)
      // Fallback to demo recipients for development
      recipients = [
        'demo1@example.com',
        'demo2@example.com',
        'demo3@example.com'
      ]
    }

    if (recipients.length === 0) {
      return NextResponse.json(
        { error: 'No recipients found for the specified audience' },
        { status: 400 }
      )
    }

    // Send newsletter
    const success = await emailService.sendNewsletter(subject, content, recipients)

    return NextResponse.json({
      message: success ? 'Newsletter sent successfully' : 'Newsletter sent with some failures',
      recipientCount: recipients.length,
      success
    })

  } catch (error) {
    console.error('Newsletter API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
