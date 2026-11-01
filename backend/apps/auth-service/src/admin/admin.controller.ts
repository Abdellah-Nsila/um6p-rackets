import { Controller } from "@nestjs/common";
import { AdminService } from "./admin.service.js";
import { AdminListUsersQueryDto } from "@app/contracts/admin/dto/admin-list-users-query.dto.js";
import { Payload, MessagePattern } from "@nestjs/microservices";
import { AUTH_PATTERNS } from "@app/contracts";
import { AdminUpdateUserDto } from "@app/contracts/admin/dto/index.js";

@Controller()
export class AdminController { 
  constructor(private readonly adminService: AdminService) {}

  @MessagePattern(AUTH_PATTERNS.ADMIN_LIST_USERS)
  async listUsers(@Payload() query: AdminListUsersQueryDto) {
    console.log(`[AuthService] Received admin list users request`);
    return await this.adminService.listUsers(query);
  }

  @MessagePattern(AUTH_PATTERNS.ADMIN_UPDATE_USER)
  async updateUser(@Payload() payload: { admin_id: number; user_id: number; body: AdminUpdateUserDto }) {
    console.log(`[AuthService] Received admin update user request`);
    return await this.adminService.updateUser(payload.admin_id, payload.user_id, payload.body);
  }

  @MessagePattern(AUTH_PATTERNS.ADMIN_DELETE_USER)
  async deleteUser(@Payload() payload: { admin_id: number; user_id: number }) {
    return await this.adminService.deleteUser(payload.admin_id, payload.user_id);
  }

  @MessagePattern(AUTH_PATTERNS.ADMIN_STATS)
  async getStats(@Payload() payload: { weeks: number }){
    console.log(`[AuthService] Received admin stats request`);
    return await this.adminService.getStats(payload.weeks);
  }

}