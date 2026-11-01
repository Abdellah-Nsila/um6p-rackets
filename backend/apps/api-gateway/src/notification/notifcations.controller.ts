import {
  Controller,
  Get,
  Inject,
  Param,
  ParseIntPipe,
  Post,
  Query,
  ServiceUnavailableException,
  BadRequestException,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  catchError,
  firstValueFrom,
  throwError,
  timeout,
  TimeoutError,
} from 'rxjs';
import {NOTIFICATION_PATTERNS,NOTIFICATION_SERVICE,GetInboxQueryDto,MarkAsReadDto,MarkAllAsReadDto,
} from '@app/contracts';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { type AuthenticatedUser } from '@app/common';
import { PaginationQueryDto } from '@app/contracts/club/dto/index.js';

@Controller('notifications')
export class NotificationsController {
  constructor(
    @Inject(NOTIFICATION_SERVICE)
    private readonly notificationClient: ClientProxy,
  ) {}

  private withTimeout<T>(response: import('rxjs').Observable<T>) {
    return response.pipe(
      timeout(5000),
      catchError((e) =>
        throwError(() =>
          e instanceof TimeoutError
            ? new ServiceUnavailableException(
                'Notification service is not responding',
              )
            : e,
        ),
      ),
    );
  }

  // @Get('hello')
  // async hello() {
  //   return firstValueFrom(
  //     this.withTimeout(
  //       this.notificationClient.send(NOTIFICATION_PATTERNS.HELLO, {}),
  //     ),
  //   );
  // }

  @Get('inbox')
  async getInbox(
    @CurrentUser() user: AuthenticatedUser,
    @Query() { page, limit }: PaginationQueryDto,
  ) {
    console.log(
      `[NotificationsController] Received request to get inbox for user_id: ${user.id}, page: ${page}, limit: ${limit}`,
    );
    return firstValueFrom(
      this.withTimeout(
        this.notificationClient.send(NOTIFICATION_PATTERNS.GET_INBOX, {
          user_id: String(user.id),
          page,
          limit,
        }),
      ),
    );
  }

  @Post(':notification_id/read')
  async markAsRead(
    @Param('notification_id') notification_id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!/^[0-9]+$/.test(notification_id)) {
      throw new BadRequestException('Invalid notification ID');
    }

    const payload: MarkAsReadDto = {
      notification_id,
      user_id: String(user.id),
    };

    return firstValueFrom(
      this.withTimeout(
        this.notificationClient.send(
          NOTIFICATION_PATTERNS.MARK_AS_READ,
          payload,
        ),
      ),
    );
  }

  @Post('read-all')
  async markAllAsRead(@CurrentUser() user: AuthenticatedUser) {
    const payload: MarkAllAsReadDto = {
      user_id: String(user.id),
    };

    return firstValueFrom(
      this.withTimeout(
        this.notificationClient.send(
          NOTIFICATION_PATTERNS.MARK_ALL_AS_READ,
          payload,
        ),
      ),
    );
  }
}
