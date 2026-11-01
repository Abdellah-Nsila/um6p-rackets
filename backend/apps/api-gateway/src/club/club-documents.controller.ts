import { CLUB_PATTERNS, CLUB_SERVICE } from '@app/contracts';
import {
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { type AuthenticatedUser } from '@app/common';
import { Body } from '@nestjs/common';
import {
  ClubSlugParamDto,
  PaginationQueryDto,
  DeleteDocumentParamDto,
  CreateDocumentDto,
} from '@app/contracts/club/dto/index.js';

@Controller('clubs/:slug/documents')
export class ClubDocumentsController {
  constructor(@Inject(CLUB_SERVICE) private readonly clubClient: ClientProxy) {}

  // GET /clubs/:slug/documents?page=&limit=
  @Get()
  async getClubDocuments(
    @Param() { slug }: ClubSlugParamDto,
    @CurrentUser() user: AuthenticatedUser,
    @Query() { page, limit }: PaginationQueryDto,
  ) {
    console.log(
      `[ClubController] Received request to get club documents for slug: ${slug} and user_id: ${user.id}, and send request to Club Service with page: ${page} and limit: ${limit}`,
    );
    const response = this.clubClient.send(CLUB_PATTERNS.GET_CLUB_DOCUMENTS, {
      slug: slug,
      user_id: user.id,
      page,
      limit,
    });
    return response;
  }

  // POST /clubs/:slug/documents
  @Post()
  async createClubDocument(
    @Param() { slug }: ClubSlugParamDto,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CreateDocumentDto,
  ) {
    console.log(
      `[ClubController] Received request to create club document for slug: ${slug} and user_id: ${user.id}, and send request to Club Service with body: ${JSON.stringify(body)}`,
    );
    const response = this.clubClient.send(
      CLUB_PATTERNS.POST_CLUB_DOCUMENT_CREATE,
      {
        slug: slug,
        user_id: user.id,
        title: body.title,
        description: body.description,
        path: body.path,
      },
    );
    return response;
  }

  // DELETE /clubs/:slug/documents/:document_id
  @Delete(':document_id')
  async deleteClubDocument(
    @Param() { slug, document_id }: DeleteDocumentParamDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    console.log(
      `[ClubController] Received request to delete club document for slug: ${slug} and user_id: ${user.id}, and send request to Club Service with document_id: ${document_id}`,
    );
    const response = this.clubClient.send(
      CLUB_PATTERNS.DELETE_CLUB_DOCUMENT_DELETE,
      {
        slug: slug,
        user_id: user.id,
        document_id: document_id,
      },
    );
    return response;
  }
}
