import { Controller } from "@nestjs/common";
import { MatchesService } from "./matches.service.js";
import { MessagePattern } from "@nestjs/microservices";
import { CLUB_PATTERNS } from "@app/contracts/patterns.js";
import { MatchesQueryDto, MatchRequestDto, MatchResultDto } from "@app/contracts/club/dto/index.js";


@Controller()
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}
  @MessagePattern(CLUB_PATTERNS.POST_CLUB_MATCH_REQUEST)
  async requestMatch(data: { slug: string; user_id: number; body: MatchRequestDto }) {
    return await this.matchesService.requestMatch(data.slug, data.user_id, data.body);
  }

  @MessagePattern(CLUB_PATTERNS.GET_CLUB_MATCHES)
  async getMatches(data: { slug: string; user_id: number; query: MatchesQueryDto }) {
    return await this.matchesService.getMatches(data.slug, data.user_id, data.query);
  }

  @MessagePattern(CLUB_PATTERNS.GET_CLUB_MATCH)
  async getMatch(data: { slug: string; user_id: number; match_id: number }) {
    return await this.matchesService.getMatch(data.slug, data.user_id, data.match_id);
  }

  // accept, reject, cancel, result match endpoints
  @MessagePattern(CLUB_PATTERNS.POST_CLUB_MATCH_ACCEPT)
  async acceptMatch(data: { slug: string; user_id: number; match_id: number }) {
    return await this.matchesService.acceptMatch(data.slug, data.user_id, data.match_id);
  }

  @MessagePattern(CLUB_PATTERNS.POST_CLUB_MATCH_CANCEL)
  async cancelMatch(data: { slug: string; user_id: number; match_id: number }) {
    return await this.matchesService.cancelMatch(data.slug, data.user_id, data.match_id);
  }

  @MessagePattern(CLUB_PATTERNS.POST_CLUB_MATCH_RESULT)
  async submitMatchResult(data: { slug: string; user_id: number; match_id: number; result: MatchResultDto }) {
    return await this.matchesService.submitMatchResult(data.slug, data.user_id, data.match_id, data.result);
  }
}