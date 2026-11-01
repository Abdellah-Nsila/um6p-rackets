
"use client";

import {
  createContext,
  useContext,
  type ReactNode,
} from "react";
import type {
  InboxItem,
  NotificationRealtimePayload,
} from "@/types/contracts/notification";
import { useMe } from "@/hooks/use-me";
import { useNotificationInbox } from "@/hooks/use-notification-inbox";
import { useNotificationSocket } from "@/hooks/use-notification-socket";
import { useMarkAllNotificationsAsRead } from "@/hooks/use-notification-mark-all-as-read";

interface NotificationContextType {
  notifications: NotificationRealtimePayload[];
  connected: boolean;
  // markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  markingAllAsRead: boolean;
}

const NotificationContext =
  createContext<NotificationContextType | null>(null);

function mapInboxItem(
  item: InboxItem,
): NotificationRealtimePayload {
  return {
    notification_id: item.notification_id,
    event_id: item.notification.event_id,
    sender_type: item.notification.sender_type,
    sender_id: item.notification.sender_id,
    sender_name: item.notification.sender_name,
    sender_avatar_url: item.notification.sender_avatar_url,
    category: item.notification.category,
    type: item.notification.type,
    club_id: item.notification.club_id,
    club_name: item.notification.club_name,
    sent_at: item.notification.sent_at,
    is_read: item.is_read,
  };
}

export function NotificationProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { data: user } = useMe();
  const userId = user?.id;

  const inboxQuery = useNotificationInbox(userId);
  const { connected } = useNotificationSocket(userId);

  // const markOne = useMarkNotificationAsRead(userId);
  const markAll = useMarkAllNotificationsAsRead(userId);

  const notifications =
    inboxQuery.data?.items.map(mapInboxItem) ?? [];

  return (
    <NotificationContext.Provider
  value={{
    notifications,
    connected,
    markingAllAsRead: markAll.isPending,
    markAllAsRead: () => markAll.mutate(),
    // markAsRead: (id) => markOne.mutate(id),
  }}
>
  {children}
</NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error(
      "useNotifications must be used inside NotificationProvider",
    );
  }

  return context;
}
