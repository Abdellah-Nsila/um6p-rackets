import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import {
  NOTIFICATION_REALTIME_EVENTS,
  type NotificationEventDto,
} from '@app/contracts';
import { NotificationsGateway } from './notifications.gateway.js';

@Controller()
export class NotificationEventsConsumer {
  private readonly logger = new Logger(NotificationEventsConsumer.name);

  constructor(
    private readonly notificationsGateway: NotificationsGateway,
  ) {}


  @EventPattern(NOTIFICATION_REALTIME_EVENTS.NEW_NOTIFICATION)
    handleNewNotification(@Payload() data: any): void {
      if (!Array.isArray(data.receiver_user_ids)) {
        this.logger.warn('Invalid notification event: missing recipients');
        return;
      }

      const notification = {
        notification_id: data.notification_id,
        event_id: data.event_id,
        sender_type: data.sender_type,
        sender_id: data.sender_id ?? null,
        sender_name: data.sender_name ?? null,
        sender_avatar_url: data.sender_avatar_url ?? null,
        category: data.category,
        type: data.type,
        club_id: data.club_id ?? null,
        club_name: data.club_name ?? null,
        sent_at: data.sent_at,
        is_read: false,
      };

      for (const userId of data.receiver_user_ids) {
        this.notificationsGateway.sendToUser(userId, notification);
      }
    }
}