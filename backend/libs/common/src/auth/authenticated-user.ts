
import { UserRole } from '@app/contracts';

export interface AuthenticatedUser { id: number; login: string, role: UserRole; }