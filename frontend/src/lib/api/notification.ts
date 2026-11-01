import { api, post } from './api';
import type { InboxResponse } from '@/types/contracts/notification';

export const getInbox = (page = 1, limit = 10) =>
  api<InboxResponse>(
    `/notifications/inbox?page=${page}&limit=${limit}`,
  );


export interface MarkAsReadResponse {
    notification_id: string;
    is_read: boolean;
    read_at: string | null;  
}

export const markNotificationAsRead = (notificationId: string) =>
    post<MarkAsReadResponse>(
      `/notifications/${encodeURIComponent(notificationId)}/read`,
    );
export const markAllNotificationsAsRead = () =>
    post<{ count: number }>("/notifications/read-all");