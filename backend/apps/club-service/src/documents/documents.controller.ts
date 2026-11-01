import { Controller } from '@nestjs/common';
import { DocumentsService } from './documents.service.js';
import { MessagePattern } from '@nestjs/microservices';
import { CLUB_PATTERNS } from '@app/contracts/patterns.js';
import { CreateDocumentDto } from '@app/contracts/club/dto/index.js';

@Controller()
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}
  @MessagePattern(CLUB_PATTERNS.POST_CLUB_DOCUMENT_CREATE)
  async createDocument(data: { slug: string; user_id: number;} & CreateDocumentDto) {
    return this.documentsService.createDocument(data.slug, data.user_id, data.path, data.title, data.description);
  }

  @MessagePattern(CLUB_PATTERNS.DELETE_CLUB_DOCUMENT_DELETE)
  async deleteDocument(data: { slug: string; user_id: number; document_id: number }) {
    return this.documentsService.deleteDocument(data.slug, data.user_id, data.document_id);
  }

  @MessagePattern(CLUB_PATTERNS.GET_CLUB_DOCUMENTS)
  async getClubDocuments(data: { slug: string; user_id: number; page: number; limit: number }) {
    return this.documentsService.getClubDocuments(data.slug, data.user_id, data.page, data.limit);
  }
  
}
