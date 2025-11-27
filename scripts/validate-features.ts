
import { StatsService, EngagementDataService, AlumniDataService } from '../src/lib/data-service';
import { NotificationService } from '../src/lib/notification-service';

async function validateFeatures() {
    console.log('--- Validating Analytics & Notifications ---');

    // 1. Validate StatsService
    console.log('\n1. Testing StatsService...');
    const overview = StatsService.getOverview();
    console.log('Overview Stats:', overview);

    const locationStats = StatsService.getAlumniByLocation();
    console.log('Alumni by Location (Top 3):', Object.entries(locationStats).slice(0, 3));

    const donationTrends = StatsService.getDonationTrends();
    console.log('Donation Trends (Last 3 months):', donationTrends.slice(-3));

    // 2. Validate EngagementDataService
    console.log('\n2. Testing EngagementDataService...');
    const engagementStats = EngagementDataService.getEngagementStats();
    console.log('Engagement Stats:', engagementStats);

    // 3. Validate NotificationService
    console.log('\n3. Testing NotificationService...');
    const testUserEmail = 'alumni1@slu.edu'; // Assuming this exists or we can mock

    // Create a notification
    const notif = await NotificationService.create({
        recipientEmail: testUserEmail,
        type: 'system_alert',
        title: 'Test Notification',
        message: 'This is a test notification',
        sendEmail: false // Don't actually send email during test
    });
    console.log('Created Notification:', notif);

    // Retrieve notifications
    const userNotifs = NotificationService.getAll(testUserEmail);
    console.log(`User has ${userNotifs.length} notifications.`);

    const unreadCount = NotificationService.getUnreadCount(testUserEmail);
    console.log(`User has ${unreadCount} unread notifications.`);

    // Mark as read
    NotificationService.markAsRead(notif.id, testUserEmail);
    console.log('Marked notification as read.');

    const newUnreadCount = NotificationService.getUnreadCount(testUserEmail);
    console.log(`User has ${newUnreadCount} unread notifications.`);

    console.log('\n--- Validation Complete ---');
}

validateFeatures().catch(console.error);
