import fs from 'fs';
import path from 'path';
import { emailService, NotificationData } from './email-service';
import { AlumniDataService } from './data-service';

export interface Notification {
    id: string;
    recipientEmail: string;
    senderEmail: string;
    senderName: string;
    type: 'message' | 'connection_request' | 'event_invite' | 'donation_thank_you' | 'rsvp_confirmation' | 'mentorship_request' | 'system_alert';
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
    relatedId?: string;
}

const filePath = path.join(process.cwd(), 'src/data', 'notifications.json');

// Load initial data
let notifications: Notification[] = [];
try {
    // Ensure directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        if (content.trim()) {
            notifications = JSON.parse(content);
        }
    }
} catch (error) {
    console.error('Error loading notifications:', error);
}

const saveNotifications = () => {
    try {
        fs.writeFileSync(filePath, JSON.stringify(notifications, null, 2));
    } catch (error) {
        console.error('Error saving notifications:', error);
    }
};

export class NotificationService {
    static getAll(userEmail: string) {
        return notifications
            .filter(n => n.recipientEmail === userEmail)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    static getUnreadCount(userEmail: string) {
        return notifications.filter(n => n.recipientEmail === userEmail && !n.isRead).length;
    }

    static markAsRead(id: string, userEmail: string) {
        const notification = notifications.find(n => n.id === id && n.recipientEmail === userEmail);
        if (notification) {
            notification.isRead = true;
            saveNotifications();
            return true;
        }
        return false;
    }

    static markAllAsRead(userEmail: string) {
        let changed = false;
        notifications.forEach(n => {
            if (n.recipientEmail === userEmail && !n.isRead) {
                n.isRead = true;
                changed = true;
            }
        });
        if (changed) saveNotifications();
    }

    static async create(params: {
        recipientEmail: string;
        senderEmail?: string;
        senderName?: string;
        type: Notification['type'];
        title: string;
        message: string;
        relatedId?: string;
        sendEmail?: boolean;
        emailData?: Record<string, unknown>; // For the email template
    }) {
        const { recipientEmail, senderEmail = 'system@slu.edu', senderName = 'SLU Alumni Connect', type, title, message, relatedId, sendEmail = true, emailData } = params;

        // 1. Create In-App Notification
        const newNotification: Notification = {
            id: `NOT${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            recipientEmail,
            senderEmail,
            senderName,
            type,
            title,
            message,
            isRead: false,
            createdAt: new Date().toISOString(),
            relatedId
        };

        notifications.push(newNotification);
        saveNotifications();

        // 2. Send Email (if requested)
        if (sendEmail) {
            const recipient = AlumniDataService.getAll().find(a => a.email === recipientEmail);
            if (recipient) {
                // Map notification type to email type
                let emailType: NotificationData['type'] | null = null;

                if (type === 'connection_request') emailType = 'connection_request';
                else if (type === 'donation_thank_you') emailType = 'donation_receipt';
                else if (type === 'mentorship_request') emailType = 'mentorship_request';
                // Add others as needed

                if (emailType) {
                    try {
                        await emailService.sendNotification({
                            type: emailType,
                            recipient: {
                                email: recipient.email,
                                firstName: recipient.firstName,
                                lastName: recipient.lastName
                            },
                            data: emailData || { message } // Fallback or specific data
                        });
                    } catch (error) {
                        console.error('Error sending email notification:', error);
                    }
                }
            }
        }

        return newNotification;
    }
}
