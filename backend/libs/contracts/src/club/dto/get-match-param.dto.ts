import { ClubSlugParamDto } from "./club-slug-param.dto.js";
import { IsIdParam } from "@app/common";

export class GetMatchParamDto extends ClubSlugParamDto {
  @IsIdParam('match')
  match_id: number;
}