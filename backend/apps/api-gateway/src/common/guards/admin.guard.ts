import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import { UserRole } from '@app/contracts/auth/auth.types.js';

type RequestWithUser = { user?: { role?: UserRole } };

// Runs AFTER your global JWT guard (global guards run before controller guards),
// so a missing or invalid token is already a 401 and this only decides 403.
// It reads request.user.role, which your JWT strategy must put there.
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithUser>();

    console.log('AdminGuard: request.user.role =', request.user?.role);
    if (request.user?.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Admin access required');
    }
    return true;
  }
}