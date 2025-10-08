
interface Notification {
  id: string; // Unique ID, e.g., '2024-07-28-update'
  message: string;
  link?: string; // Optional internal link (e.g., '/dashboard')
  linkText?: string; // e.g., 'Check it out'
}

// To send a new notification, update the details below and ensure 'id' is unique.
export const currentNotification: Notification | null = {
  id: '2024-07-28-banner-feature',
  message: "New Feature! You can now receive important updates and announcements directly in the app.",
  link: '/timeline',
  linkText: 'View Agenda'
};

// To disable notifications, set currentNotification to null:
// export const currentNotification: Notification | null = null;
