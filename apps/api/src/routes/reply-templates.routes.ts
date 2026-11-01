import type { Routes } from '@nestjs/core';
import { ReplyTemplatesModule } from '@/modules/reply-templates';

export const replyTemplatesRoutes: Routes = [{ path: 'reply-templates', module: ReplyTemplatesModule }];
