import { Injectable } from '@nestjs/common';
import type { AuthUser, RequestContext } from '../../../common/security/types';
import { ImportQueryService } from './import-query.service';
import { ImportTemplateService } from './import-template.service';
import { ImportUploadService } from './import-upload.service';

/** Fachada del modulo. */
@Injectable()
export class ImportsService {
  constructor(
    private readonly uploader: ImportUploadService,
    private readonly queries: ImportQueryService,
    private readonly templates: ImportTemplateService,
  ) {}

  upload(user: AuthUser, file: Express.Multer.File | undefined, ctx: RequestContext) {
    return this.uploader.upload(user, file, ctx);
  }
  list(user: AuthUser, page?: number, limit?: number) {
    return this.queries.list(user, page, limit);
  }
  detail(user: AuthUser, id: string) {
    return this.queries.detail(user, id);
  }
  templateXlsx() {
    return this.templates.xlsx();
  }
  templateCsv() {
    return this.templates.csv();
  }
}
