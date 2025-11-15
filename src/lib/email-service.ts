// Email service for sending notifications
// In production, this would integrate with services like SendGrid, Mailgun, or AWS SES

export interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface NotificationData {
  type: 'welcome' | 'event_reminder' | 'mentorship_request' | 'donation_receipt' | 'connection_request';
  recipient: {
    email: string;
    firstName: string;
    lastName: string;
  };
  data: any;
}

class EmailService {
  private apiKey: string;
  private fromEmail: string;

  constructor() {
    // In production, these would come from environment variables
    this.apiKey = process.env.EMAIL_API_KEY || 'demo-key';
    this.fromEmail = process.env.FROM_EMAIL || 'noreply@slu-alumni.edu';
  }

  async sendEmail(template: EmailTemplate): Promise<boolean> {
    try {
      // In production, this would make an actual API call to your email service
      console.log('Sending email:', {
        to: template.to,
        subject: template.subject,
        from: this.fromEmail
      });

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // For demo purposes, always return success
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }

  async sendNotification(notification: NotificationData): Promise<boolean> {
    const template = this.generateTemplate(notification);
    return await this.sendEmail(template);
  }

  private generateTemplate(notification: NotificationData): EmailTemplate {
    const { type, recipient, data } = notification;
    const { firstName, lastName, email } = recipient;

    switch (type) {
      case 'welcome':
        return {
          to: email,
          subject: 'Welcome to SLU Alumni Connect!',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #003366;">Welcome to SLU Alumni Connect, ${firstName}!</h1>
              <p>We're excited to have you join our alumni community.</p>
              <p>Here's what you can do next:</p>
              <ul>
                <li>Complete your profile</li>
                <li>Connect with fellow alumni</li>
                <li>Explore upcoming events</li>
                <li>Find mentorship opportunities</li>
              </ul>
              <a href="${data.profileUrl}" style="background-color: #003366; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 20px 0;">
                Complete Your Profile
              </a>
              <p>Best regards,<br>The SLU Alumni Team</p>
            </div>
          `,
          text: `Welcome to SLU Alumni Connect, ${firstName}! Complete your profile at ${data.profileUrl}`
        };

      case 'event_reminder':
        return {
          to: email,
          subject: `Reminder: ${data.eventTitle} is tomorrow`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #003366;">Event Reminder</h1>
              <p>Hi ${firstName},</p>
              <p>This is a friendly reminder that you're registered for:</p>
              <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h2 style="margin: 0 0 10px 0; color: #003366;">${data.eventTitle}</h2>
                <p style="margin: 5px 0;"><strong>Date:</strong> ${data.eventDate}</p>
                <p style="margin: 5px 0;"><strong>Time:</strong> ${data.eventTime}</p>
                <p style="margin: 5px 0;"><strong>Location:</strong> ${data.eventLocation}</p>
              </div>
              <a href="${data.eventUrl}" style="background-color: #00A5A5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 20px 0;">
                View Event Details
              </a>
              <p>We look forward to seeing you there!</p>
            </div>
          `,
          text: `Event Reminder: ${data.eventTitle} is tomorrow at ${data.eventTime}. Location: ${data.eventLocation}`
        };

      case 'mentorship_request':
        return {
          to: email,
          subject: 'New Mentorship Request',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #003366;">New Mentorship Request</h1>
              <p>Hi ${firstName},</p>
              <p>You have received a new mentorship request from <strong>${data.requesterName}</strong>.</p>
              <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Area of Interest:</strong> ${data.mentorshipArea}</p>
                <p><strong>Message:</strong></p>
                <p style="font-style: italic;">"${data.message}"</p>
              </div>
              <a href="${data.mentorshipUrl}" style="background-color: #FFB81C; color: #003366; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 20px 0;">
                Review Request
              </a>
              <p>Thank you for being part of our mentorship program!</p>
            </div>
          `,
          text: `New mentorship request from ${data.requesterName} for ${data.mentorshipArea}. Review at ${data.mentorshipUrl}`
        };

      case 'donation_receipt':
        return {
          to: email,
          subject: 'Thank you for your donation!',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #003366;">Thank You for Your Generosity!</h1>
              <p>Dear ${firstName},</p>
              <p>Thank you for your generous donation to SLU Alumni Connect.</p>
              <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin: 0 0 15px 0; color: #003366;">Donation Details</h3>
                <p style="margin: 5px 0;"><strong>Amount:</strong> $${data.amount}</p>
                <p style="margin: 5px 0;"><strong>Campaign:</strong> ${data.campaign}</p>
                <p style="margin: 5px 0;"><strong>Date:</strong> ${data.date}</p>
                <p style="margin: 5px 0;"><strong>Transaction ID:</strong> ${data.transactionId}</p>
              </div>
              <p>Your contribution makes a real difference in the lives of our students and alumni community.</p>
              <a href="${data.receiptUrl}" style="background-color: #003366; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 20px 0;">
                Download Receipt
              </a>
              <p>With gratitude,<br>The SLU Alumni Team</p>
            </div>
          `,
          text: `Thank you for your $${data.amount} donation to ${data.campaign}. Transaction ID: ${data.transactionId}`
        };

      case 'connection_request':
        return {
          to: email,
          subject: 'New Connection Request',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #003366;">New Connection Request</h1>
              <p>Hi ${firstName},</p>
              <p><strong>${data.requesterName}</strong> (Class of ${data.requesterGradYear}) would like to connect with you on SLU Alumni Connect.</p>
              <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Current Position:</strong> ${data.requesterTitle} at ${data.requesterCompany}</p>
                <p><strong>Message:</strong></p>
                <p style="font-style: italic;">"${data.message}"</p>
              </div>
              <a href="${data.connectionUrl}" style="background-color: #00A5A5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 20px 0;">
                View Profile & Respond
              </a>
              <p>Expand your professional network with fellow SLU alumni!</p>
            </div>
          `,
          text: `${data.requesterName} wants to connect with you on SLU Alumni Connect. View their profile at ${data.connectionUrl}`
        };

      default:
        throw new Error(`Unknown notification type: ${type}`);
    }
  }

  // Batch email sending for newsletters, announcements, etc.
  async sendBulkEmails(templates: EmailTemplate[]): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const template of templates) {
      const result = await this.sendEmail(template);
      if (result) {
        success++;
      } else {
        failed++;
      }
    }

    return { success, failed };
  }

  // Send newsletter to all active users
  async sendNewsletter(subject: string, content: string, recipients: string[]): Promise<boolean> {
    const templates: EmailTemplate[] = recipients.map(email => ({
      to: email,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #003366;">SLU Alumni Newsletter</h1>
          ${content}
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
          <p style="font-size: 12px; color: #666;">
            You're receiving this because you're a member of SLU Alumni Connect.
            <a href="#" style="color: #003366;">Unsubscribe</a>
          </p>
        </div>
      `,
      text: content.replace(/<[^>]*>/g, '') // Strip HTML for text version
    }));

    const result = await this.sendBulkEmails(templates);
    console.log(`Newsletter sent: ${result.success} successful, ${result.failed} failed`);
    
    return result.failed === 0;
  }
}

export const emailService = new EmailService();
