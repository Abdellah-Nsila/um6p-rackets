import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AuthServiceService } from './auth-service.service.js';
import { AUTH_PATTERNS, type AuthTokens, UpdateUserDto, OAuthLoginDto, RegisterDto, User, SuccessResult, AuthResult, HealthResult } from '@app/contracts';
import { LoginDto } from '@app/contracts/auth/dto/login.dto.js';
import { UsersService } from './users/users.service.js';

@Controller()
export class AuthServiceController {
  constructor(
    private readonly authServiceService: AuthServiceService,
    private readonly usersService: UsersService
  ) {}


  @MessagePattern(AUTH_PATTERNS.HEALTH)
  async health(): Promise<HealthResult> {
    console.log(`[AuthService] Health check requested`);
    return await this.authServiceService.health();
  }

  @MessagePattern(AUTH_PATTERNS.REGISTER)
  async register(@Payload() dto: RegisterDto): Promise<AuthResult> {
    console.log(`[AuthService] Received registration request for email: ${dto.email}`);
    return await this.authServiceService.register(dto);
  }

  @MessagePattern(AUTH_PATTERNS.LOGIN)
  async login(@Payload() dto: LoginDto): Promise<AuthResult> {
    console.log(`[AuthService] Received login request for email: ${dto.email}`);
    return await this.authServiceService.login(dto);
  }

  @MessagePattern(AUTH_PATTERNS.REFRESH)
  async refresh(@Payload() data: { refresh_token: string }): Promise<AuthTokens> {
    console.log(`[AuthService] Received refresh request`);
    return await this.authServiceService.refresh(data.refresh_token);
  }

  @MessagePattern(AUTH_PATTERNS.OAUTH_LOGIN)
  async oAuthLogin(@Payload() dto: OAuthLoginDto): Promise<AuthResult | null> {
    console.log(`[AuthService] Received OAuth login request`);
    return await this.authServiceService.oAuthLogin(dto);
  }

  @MessagePattern(AUTH_PATTERNS.LOGOUT)
  async logout(@Payload() data: AuthTokens): Promise<SuccessResult> {
    console.log(`[AuthService] Received logout request`);
    return await this.authServiceService.logout(data.refresh_token);
  }

  @MessagePattern(AUTH_PATTERNS.FORGET_PASSWORD)
  async forgetPassword(@Payload() data: { email: string }): Promise<SuccessResult> {
    console.log(`[AuthService] Received forget password request for email: ${data.email}`);
    return await this.authServiceService.forgetPassword(data.email);
  }

  @MessagePattern(AUTH_PATTERNS.RESET_PASSWORD)
  async resetPassword(@Payload() data: { token: string, password: string }): Promise<SuccessResult> {
    console.log(`[AuthService] Received reset password request`);
    return await this.authServiceService.resetPassword(data.token, data.password);
  }

  @MessagePattern(AUTH_PATTERNS.UPDATE_USER)
  async updateProfile(@Payload() data: { user_id: string, profileData: UpdateUserDto }): Promise<User> {
    console.log(`[AuthService] Received request to update profile for user: ${data.user_id}`);
    return await this.usersService.updateUser(Number(data.user_id), data.profileData);
  }

  @MessagePattern(AUTH_PATTERNS.IS_LOGIN_AVAILABLE)
  async isLoginAvailable(@Payload() data: { login: string }): Promise<boolean> {
    console.log(`[AuthService] Received request to check login availability for: ${data.login}`);
    return await this.usersService.isLoginAvailable(data.login);
  }

  // get user by id
  @MessagePattern(AUTH_PATTERNS.GET_USER_BY_ID)
  async getUserById(@Payload() data: { user_id: number }): Promise<User | null> {
    console.log(`[AuthService] Received request for user by ID: ${data.user_id}`);
    return await this.usersService.findById(data.user_id);
  }

  // get user by login
  @MessagePattern(AUTH_PATTERNS.GET_USER_BY_LOGIN)
  async getUserByLogin(@Payload() data: { login: string }): Promise<User | null> {
    console.log(`[AuthService] Received request for user by login: ${data.login}`);
    return await this.usersService.findByLogin(data.login);
  }

  // get many users by ids
  @MessagePattern(AUTH_PATTERNS.GET_USERS_BY_IDS)
  async getUsersByIds(@Payload() data: { user_ids: string[] }): Promise<User[]> {
    // Defend against undefined payloads over RPC
    const ids = data?.user_ids || [];
    console.log(`[AuthService] Received request for users by IDs: ${ids.join(', ')}`);
    return await this.usersService.findManyByIds(ids);
  }

}
