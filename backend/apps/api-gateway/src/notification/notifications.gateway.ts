import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { WsAuthService } from './ws-auth.service.js';

@WebSocketGateway({ namespace: '/notifications' })

export class NotificationsGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  constructor(private readonly wsAuth: WsAuthService) {}

  async handleConnection(socket: Socket): Promise<void> {
    try {
      const userId = await this.wsAuth.authenticate(socket);
      await socket.join(`user:${userId}`);
    } catch {
      socket.disconnect(true);
    }
  }
  
  sendToUser(userId: string, notification: unknown): void {
    this.server.to(`user:${userId}`).emit('notification:new', notification);
  }
  // this for SYSTEM notificatin | we boradcast to all users
  sendToAll(notification: unknown): void {
    this.server.emit('notification:new', notification);
  }
  // do we need to add the user guard for each notificatio  socket event?
  // for announcement notification | do we create a group for each club and send to that group? or we just send to all users and let the client filter it out?

}