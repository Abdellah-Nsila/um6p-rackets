import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';

import { OAuthLoginDto, UpdateUserDto, User } from '@app/contracts';
import { PrismaService } from '../prisma/prisma.service.js';
import type { User as PrismaUser } from '../generated/prisma/client.js';
import { toUser } from './user.mapper.js';
import * as argon2 from 'argon2';

// This is a dummy hash used for timing attack prevention. It is a valid Argon2id hash of the password "somesalt".
const DUMMY_HASH = '$argon2id$v=19$m=65536,t=3,p=4$c29tZXNhbHQ$R29vZEx1Y2tXaXRoVGhhdEFyZ29uMklkSGFzaA';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  private async findRawByEmail(email: string): Promise<PrismaUser | null> {
    return await this.prisma.user.findFirst({ where: { email: email, deleted_at: null } });
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = await this.findRawByEmail(email);
    return row ? toUser(row) : null;
  }

  async findByLogin(login: string): Promise<User | null> {
    const row = await this.prisma.user.findFirst({ where: { login: login, deleted_at: null } });
    return row ? toUser(row) : null;
  }

  async findById(id: number): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { id, deleted_at: null } });
    return row ? toUser(row) : null;
  }

  async findMany(ids: number[]): Promise<User[]> {
    const rows = await this.prisma.user.findMany({ where: { id: { in: ids }, deleted_at: null } });
    return rows.map(row => toUser(row)); // Map arrays cleanly
  }

  async findManyByIds(ids: string[]): Promise<User[]> {
    const numericIds = ids.map(id => parseInt(id, 10)).filter(id => !isNaN(id));
    const rows = await this.prisma.user.findMany({ where: { id: { in: numericIds }, deleted_at: null } });
    return rows.map(row => toUser(row));
  }

  async isLoginAvailable(login: string): Promise<boolean> {
    return await this.prisma.user.count({ where: { login: login } }).then(count => count === 0);
  }

  async createUser(data: {
    login: string;
    first_name: string;
    last_name: string;
    gender: boolean | null;
    department: string | null;
    phone_number: string | null;
    email: string;
    avatar: string | null;
    password_hash: string;
  }): Promise<User> {
    // 1. Await the database creation
    const user = await this.prisma.user.create({ 
      data: { 
        ...data, 
        login: data.login, 
        email: data.email 
      } 
    });
    // 2. Return the safe, mapped user (strips out password_hash)
    return toUser(user); 
  }

  async updateUser(user_id: number, dto: UpdateUserDto): Promise<User> {
    if (isNaN(user_id)) {
      throw new RpcException({ status: 400, message: 'Invalid user ID' });
    }
    const updatedUser = await this.prisma.user.update({
      where: { id: user_id },
      data: {
        login: dto.login,
        first_name: dto.first_name,
        last_name: dto.last_name,
        department: dto.department,
        phone_number: dto.phone_number,
        gender: dto.gender,
        avatar: dto.avatar,
      }
    })
    return toUser(updatedUser);
  }

  async updateUserPassword(user_id: number, newPasswordHash: string): Promise<void> {
    if (isNaN(user_id)) {
      throw new RpcException({ status: 400, message: 'Invalid user ID' });
    }
    await this.prisma.user.update({
      where: { id: user_id, deleted_at: null },
      data: {
        password_hash: newPasswordHash,
        reset_token_hash: null,
        reset_token_expiry: null,
      },
    });
  }

  async getUserByIdentity(data: {provider: string, subject: string}): Promise<User | null> {
    // Known identity: sign in
    const row = await this.prisma.identity.findFirst({
      where: {
        provider: data.provider,
        subject: data.subject,
        user: {
          deleted_at: null
        }
      },
      include: { 
        user: true 
      },
    });
    return row?.user ? toUser(row.user) : null;
  }

  async createIdentityUser(login: string, dto: OAuthLoginDto): Promise<User> {
    
    const row = await this.prisma.$transaction(async (prisma) => {
      // Create the user
      const user = await prisma.user.create({
        data: {
          login: login,
          first_name: dto.first_name,
          last_name: dto.last_name,
          gender: null,
          department: "Unknown",
          phone_number: null,
          email: dto.email,
          avatar: dto.picture ?? null,
          password_hash: null,
        },
      });

      // Create the identity link
      this.linkIdentityToUser(user.id, dto);      
      return user;  
    })
    return toUser(row);
  }

  async linkIdentityToUser(user_id: number, dto: OAuthLoginDto): Promise<void> {
    await this.prisma.identity.create({
      data: {
        provider: dto.provider,
        subject: dto.subject,
        user_id: user_id,
      },
    });
  }

  async validateCredentials(email: string, password: string): Promise<User | null> {
    const row = await this.findRawByEmail(email);
    
    // Select the hash to test: the real one if the user exists, or the dummy one if they don't
    const hashToVerify = (row && row.password_hash) ? row.password_hash : DUMMY_HASH;
    
    // ALWAYS run verify to prevent side-channel timing attacks
    const isPasswordValid = await argon2.verify(hashToVerify, password).catch(() => false);
    
    if (!row || !isPasswordValid) {
      return null;
    }

    // Strip the hash safely before returning to the Auth Service
    return toUser(row);
  }
}
