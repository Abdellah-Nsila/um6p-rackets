
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { InboxResponse } from "@/types/contracts/notification";
import { markAllNotificationsAsRead } from "@/lib/api/notification";
import { notificationKeys } from "@/hooks/use-notification-inbox";

export function useMarkAllNotificationsAsRead(
  userId: string | number | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAllNotificationsAsRead,

    onSuccess: () => {
      if (userId === undefined) return;

      const readAt = new Date().toISOString();

    // we update the inbox cache so the UI updated immediately without refreshing
      queryClient.setQueryData<InboxResponse>(
        notificationKeys.inbox(userId),
        (old) => {
          if (!old) return old;

          return {
            ...old,
            items: old.items.map((item) => ({
              ...item,
              is_read: true,
              read_at: item.read_at ?? readAt,
            })),
          };
        },
      );
    },
  });
}
