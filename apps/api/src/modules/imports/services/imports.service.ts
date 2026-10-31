import { Injectable } from '@nestjs/common';
import type { AuthUserContext, RequestContext } from '@/common/security/types';
import type { ImportJobListResource, ImportJobResource } from '../contracts/resources';
import { ImportQueryService } from './history/import-query.service';
import { ImportUploadService } from './intake/import-upload.service';
import { ImportTemplateService } from './templates/import-template.service';

/** Fachada del modulo. */
@Injectable()
export class ImportsService {
  constructor(
    private readonly uploader: ImportUploadService,
    private readonly queries: ImportQueryService,
    private readonly templates: ImportTemplateService,
  ) {}

  upload(user: AuthUserContext, file: Express.Multer.File | undefined, ctx: RequestContext): Promise<ImportJobResource> {
    return this.uploader.upload(user, file, ctx);
  }
  list(user: AuthUserContext, page?: number, limit?: number): Promise<ImportJobListResource> {
    return this.queries.list(user, page, limit);
  }
  detail(user: AuthUserContext, id: string): Promise<ImportJobResource> {
    return this.queries.detail(user, id);
  }
  templateXlsx() {
    return this.templates.xlsx();
  }
  templateCsv() {
    return this.templates.csv();
  }
}
