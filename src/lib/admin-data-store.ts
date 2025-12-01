// Admin Data Store - Manages admin notifications for signup events

export interface SignupNotification {
  id: string;
  type: 'new_signup';
  userId: string;
  userName: string;
  userEmail: string;
  createdAt: string;
  read: boolean;
}

const STORAGE_KEY = 'slu_admin_signup_notifications';

// Get all signup notifications from localStorage
export function getSignupNotifications(): SignupNotification[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

// Add a new signup notification
export function addSignupNotification(
  userId: string,
  userName: string,
  userEmail: string
): SignupNotification {
  const notification: SignupNotification = {
    id: `SIGNUP_${Date.now()}`,
    type: 'new_signup',
    userId,
    userName,
    userEmail,
    createdAt: new Date().toISOString(),
    read: false
  };
  
  const notifications = getSignupNotifications();
  notifications.unshift(notification);
  
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  }
  
  return notification;
}

// Mark a notification as read
export function markNotificationAsRead(notificationId: string): void {
  const notifications = getSignupNotifications();
  const notification = notifications.find(n => n.id === notificationId);
  
  if (notification) {
    notification.read = true;
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    }
  }
}

// Delete a notification
export function deleteNotification(notificationId: string): void {
  let notifications = getSignupNotifications();
  notifications = notifications.filter(n => n.id !== notificationId);
  
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  }
}

// Get unread notification count
export function getUnreadNotificationCount(): number {
  return getSignupNotifications().filter(n => !n.read).length;
}
