import { MapLibreWorkerSupport } from '@/support/maplibre-worker';

/** Sirve el worker de MapLibre desde node_modules: `/maplibre/maplibre-gl-worker.mjs`. */
export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const content = await MapLibreWorkerSupport.readWorkerFile(file);
  if (content === null) return new Response('No encontrado', { status: 404 });
  return new Response(content, {
    headers: {
      'Content-Type': 'text/javascript; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
