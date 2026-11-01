import { ClubSlugParamDto } from './club-slug-param.dto.js';
import { IsIdParam } from '@app/common';

export class DeleteDocumentParamDto  extends ClubSlugParamDto {
  @IsIdParam('document')
  document_id: number;
}


