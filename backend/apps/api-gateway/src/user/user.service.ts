import { rpc } from '@app/common/helpers/rpc.helper.js';
import {
  Achievement,
  AUTH_PATTERNS,
  AUTH_SERVICE,
  CLUB_PATTERNS,
  CLUB_SERVICE,
  JoinedClub,
  User,
  UserClubRank,
  UserHistoryMatch,
  UserProfileData,
} from '@app/contracts';
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class UserService {
  constructor(
    @Inject(CLUB_SERVICE) private readonly clubClient: ClientProxy,
    @Inject(AUTH_SERVICE) private readonly authClient: ClientProxy,
  ) {}
}
