export const QUEUES = {
  AUTH: 'auth_queue',
  CLUB: 'club_queue',
  NOTIFICATION: 'notification_queue',
  GATEWAY: 'gateway_queue',
} as const;

export type QueueName = (typeof QUEUES)[keyof typeof QUEUES];

export const AUTH_SERVICE = 'AUTH_SERVICE';
export const CLUB_SERVICE = 'CLUB_SERVICE';
export const GATEWAY_SERVICE = 'GATEWAY_SERVICE';
export const NOTIFICATION_SERVICE = 'NOTIFICATION_SERVICE';
export const TRANSPORTER_TOKEN = 'EMAIL_TRANSPORTER';

