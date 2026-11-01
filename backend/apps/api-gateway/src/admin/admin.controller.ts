// -> apps/api-gateway/src/admin/admin.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { type AuthenticatedUser } from '@app/common';
import {
  AdminListUsersQueryDto,
  AdminStatsQueryDto,
  AdminUpdateUserDto,
  AdminUserParamDto,
  CreateClubDto,
} from '@app/contracts/admin/dto/index.js';
import { ClubSlugParamDto } from '@app/contracts/club/dto/index.js';

import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { AdminGuard } from '../common/guards/admin.guard.js';
import { AdminService } from './admin.service.js';

// Every route here needs the global ADMIN role.
@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // jsut for testing, remove after there is another endopoint works
  // @Get('ping')
  // ping() {
  //   return { ok: true, message: 'pingooooo' };
  // }

  // GET /admin/users
  @Get('users')
  listUsers(@Query() query: AdminListUsersQueryDto) {
    return this.adminService.listUsers(query);
  }

  // PATCH /admin/users/:user_id
  @Patch('users/:user_id')
  updateUser(
    @Param() { user_id }: AdminUserParamDto,
    @CurrentUser() admin: AuthenticatedUser,
    @Body() body: AdminUpdateUserDto,
  ) {
    return this.adminService.updateUser(Number(admin.id), user_id, body);
  }

  // DELETE /admin/users/:user_id
  @Delete('users/:user_id')
  // @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUser(
    @Param() { user_id }: AdminUserParamDto,
    @CurrentUser() admin: AuthenticatedUser,
  ) {
    return await this.adminService.deleteUser(Number(admin.id), user_id);
  }

  // POST /admin/clubs
  @Post('clubs')
  createClub(@Body() body: CreateClubDto) {
    return this.adminService.createClub(body);
  }

  // DELETE /admin/clubs/:slug
  @Delete('clubs/:slug')
  // @HttpCode(HttpStatus.NO_CONTENT)
  async deleteClub(@Param() { slug }: ClubSlugParamDto) {
    return await this.adminService.deleteClub(slug);
  }

  // GET /admin/stats?weeks=8
  @Get('stats')
  getStats(@Query() { weeks }: AdminStatsQueryDto) {
    return this.adminService.getStats(weeks);
  }
}