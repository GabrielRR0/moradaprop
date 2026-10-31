/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@app/shared'],
  // Permite abrir el servidor de desarrollo desde un tunel de Cloudflare (pruebas desde el telefono).
  allowedDevOrigins: ['*.trycloudflare.com'],
};

export default nextConfig;
