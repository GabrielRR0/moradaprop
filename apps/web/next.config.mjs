/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@app/shared'],
  // El worker del mapa se lee de node_modules en tiempo de ejecucion: sin esto Vercel no lo incluye en la funcion.
  outputFileTracingIncludes: { '/maplibre/[file]': ['./node_modules/maplibre-gl/dist/*.mjs'] },
  // Permite abrir el servidor de desarrollo desde un tunel de Cloudflare (pruebas desde el telefono).
  allowedDevOrigins: ['*.trycloudflare.com'],
};

export default nextConfig;
