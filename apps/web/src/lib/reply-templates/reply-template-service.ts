import { api } from '@/lib/api';
import type { ReplyTemplate, ReplyTemplateInput, ReplyTemplateList } from './types';

const BASE = '/reply-templates';

/** Llamadas del API de textos reutilizables. El servidor guarda el título y el texto cifrados. */
export const replyTemplateService = {
  list(): Promise<ReplyTemplateList> {
    return api(BASE);
  },

  create(input: ReplyTemplateInput): Promise<ReplyTemplate> {
    return api(BASE, { method: 'POST', json: input });
  },

  update(id: string, input: Partial<ReplyTemplateInput>): Promise<ReplyTemplate> {
    return api(`${BASE}/${id}`, { method: 'PATCH', json: input });
  },

  remove(id: string): Promise<void> {
    return api(`${BASE}/${id}`, { method: 'DELETE' });
  },
};
