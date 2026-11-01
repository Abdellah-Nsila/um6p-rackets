export const EVENTS = {
  USER_DELETED: 'user.deleted',
  CLUB_ANNOUNCEMENT_CREATED: 'club.announcement_created',
  CLUB_JOIN_REQUESTED: 'club.join_requested',
  NOTIFICATION_PUSH: 'notification.push',
} as const;

export interface UserDeletedEvent {
  user_id: string;
}

// 

export const NOTIFICATION_EVENTS = {
  JOIN_REQUESTED: 'notification.join-requested',
  JOIN_ACCEPTED: 'notification.join-accepted',
  JOIN_REJECTED: 'notification.join-rejected',
  CLUB_ANNOUNCEMENT: 'notification.club-announcement',
} as const;

export const NOTIFICATION_REALTIME_EVENTS = {
  NEW_NOTIFICATION: 'new.notification',
  NOTIFICATION_READ: 'notification.read',
  NOTIFICATION_READ_ALL: 'notification.read-all',
} as const;