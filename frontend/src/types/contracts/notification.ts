export type SenderType = 'SYSTEM' | 'USER';
export type NotificationCategory = 'CLUB' | 'USER';

export type NotificationType =
  | 'JOIN_REQUESTED'
  | 'JOIN_ACCEPTED'
  | 'JOIN_REJECTED'
  | 'CLUB_ANNOUNCEMENT';

export interface NotificationRealtimePayload {
  notification_id: string;
  event_id: string;
  sender_type: SenderType;
  sender_id: string | null;
  sender_name: string | null;
  sender_avatar_url: string | null;
  category: NotificationCategory;
  type: NotificationType;
  club_id: string | null;
  club_name: string | null;
  sent_at: string;  
  is_read: boolean;
}

export interface InboxItem {
  id: string;
  notification_id: string;
  receiver_user_id: string;
  is_read: boolean;
  read_at: string | null;
  notification: {
    id: string;
    event_id: string;
    sender_type: SenderType;
    sender_id: string | null;
    sender_name: string | null;
    sender_avatar_url: string | null;
    club_name: string | null;
    category: NotificationCategory;
    type: NotificationType;
    club_id: string | null;
    sent_at: string;
  };
}

export interface InboxResponse {
  items: InboxItem[];
}