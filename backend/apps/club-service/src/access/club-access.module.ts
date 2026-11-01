import { Global, Module } from '@nestjs/common';
import { ClubAccessService } from './club-access.service.js';

@Global()
@Module({
  providers: [ClubAccessService],
  exports: [ClubAccessService],
})
export class ClubAccessModule {}