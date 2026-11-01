import { Module } from "@nestjs/common";
import { MatchesService } from "./matches.service.js";
import { MatchesController } from "./matches.controller.js";
import { LeaderboardModule } from "../leaderboard/leaderboard.module.js";


@Module({
  imports: [LeaderboardModule],
  controllers: [MatchesController],
  providers: [MatchesService],
  exports: [MatchesService],
})
export class MatchesModule {}