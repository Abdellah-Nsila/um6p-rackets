"use client";

import { useQuery } from "@tanstack/react-query";
import { getInbox } from "@/lib/api/notification";
// import { notificationKeys } from "./notification-keys";


// notification keys 
export const notificationKeys = {
  inbox: (userId: string | number) =>
    ["notifications", "inbox", userId] as const,
};

export function useNotificationInbox(
  userId: string | number | undefined,
) {
  return useQuery({
    queryKey: notificationKeys.inbox(userId ?? ""),
    queryFn: () => getInbox(1, 10),
    enabled: !!userId,
  });
}
