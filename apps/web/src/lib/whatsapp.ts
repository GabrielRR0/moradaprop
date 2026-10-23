import { brand, publicEnv } from '@/config';

/**
 * Enlace para abrir WhatsApp con un mensaje listo. Si NEXT_PUBLIC_WHATSAPP_NUMBER esta vacio
 * abre WhatsApp para elegir contacto; cuando exista el API, cada propiedad usara el
 * WhatsApp de su dueno o agente.
 */
export function whatsappUrl(message?: string, phone?: string): string {
  const number = (phone ?? publicEnv.whatsappNumber).replace(/\D/g, '');
  const text = message ?? `Hola, vi una propiedad en ${brand.name} y me interesa.`;
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}
