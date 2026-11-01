import { User } from '@app/contracts';
import type { User as PrismaUser } from '../generated/prisma/client.js';
import { toFullString } from '@app/common';

export function toUser(row: PrismaUser): User {
  return {
    id: row.id,
    login: row.login,
    first_name: row.first_name, 
    last_name: row.last_name,
    gender: row.gender,
    department: row.department,
    phone_number: row.phone_number,
    email: row.email,
    avatar: row.avatar,
    role: row.role as User['role'], // Type assertion to ensure compatibility with the User type
    // Safely convert the JavaScript Date to an ISO string
    joined_at: toFullString(row.joined_at),
  };
}
