import { Controller , Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { NotificationServiceService } from './notification-service.service.js';
import { EventPattern } from '@nestjs/microservices';
import { MarkAllAsReadDto, NOTIFICATION_PATTERNS, MarkAsReadDto, GetInboxQueryDto, GATEWAY_SERVICE, NOTIFICATION_REALTIME_EVENTS} from '@app/contracts';
import { NotificationEventDto } from '@app/contracts';
import { NOTIFICATION_EVENTS } from '@app/contracts';
import { ClientProxy } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';
import { now } from '@app/common';

@Controller()
export class NotificationServiceController {    private readonly logger = new Logger(NotificationServiceController.name);
  constructor(
    private readonly notificationService: NotificationServiceService,
    @Inject(GATEWAY_SERVICE) private readonly gatewayClient: ClientProxy,
  ) {}

    // @MessagePattern(NOTIFICATION_PATTERNS.HELLO)
    // async hello() {
    //     return this.notificationService.hello();
    // }

  // test mock data for inbox
    @MessagePattern(NOTIFICATION_PATTERNS.GET_INBOX)
    async getInbox(@Payload() data: GetInboxQueryDto) {
        return this.notificationService.getInbox(
            BigInt(data.user_id),
            data.page,
            data.limit,
        );
    }

    @MessagePattern(NOTIFICATION_PATTERNS.MARK_AS_READ)
    async markAsRead(
        @Payload()
        data: MarkAsReadDto
    ) {
        return this.notificationService.markAsRead(data);
    }

    @MessagePattern(NOTIFICATION_PATTERNS.MARK_ALL_AS_READ)
    async markAllAsRead(
        @Payload()
        data : MarkAllAsReadDto
    ) {
        return this.notificationService.markAllAsRead(data);
    }


  // ======= Event Handlers =======

    @EventPattern(NOTIFICATION_EVENTS.JOIN_REQUESTED)
    async handleJoinRequested(@Payload() data: NotificationEventDto) {
    return this.handleNotificationEvent(data);
    }

    @EventPattern(NOTIFICATION_EVENTS.JOIN_ACCEPTED)
    async handleJoinAccepted(@Payload() data: NotificationEventDto) {
    return this.handleNotificationEvent(data);
    }

    @EventPattern(NOTIFICATION_EVENTS.JOIN_REJECTED)
    async handleJoinRejected(@Payload() data: NotificationEventDto) {
    return this.handleNotificationEvent(data);
    }

    @EventPattern(NOTIFICATION_EVENTS.CLUB_ANNOUNCEMENT)
    async handleAnnouncementCreated(@Payload() data: NotificationEventDto) {
    return this.handleNotificationEvent(data);
    }
    
    private async handleNotificationEvent(data: NotificationEventDto) {
    const result = await this.notificationService.createNotification(data);

    if (!result.created) {
        this.logger.warn(
        `Notification not created: ${result.reason} (${data.event_id})`,
        );
        return result;
    }


    this.gatewayClient.emit(
        NOTIFICATION_REALTIME_EVENTS.NEW_NOTIFICATION,
        {
            notification_id: result.notificationId.toString(),
            event_id: data.event_id,
            sender_type: data.sender_type,
            sender_id: data.sender_id ?? null,
            sender_name: data.sender_name ?? null,
            sender_avatar_url: data.sender_avatar_url ?? null,
            category: data.category,
            type: data.type,
            club_id: data.club_id ?? null,
            club_name: data.club_name ?? null,
            sent_at: result.sentAt ?? now(),
            receiver_user_ids: result.receivers,
        },
    );

    return result;
    }


    // ====== WebSocket Event Handlers ======



    

}
