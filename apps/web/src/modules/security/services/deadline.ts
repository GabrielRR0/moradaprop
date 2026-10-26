/** Cuanto falta para el plazo de activar el segundo factor: "3 días", "5 horas", "12 minutos". */
export function timeLeft(isoEnd: string, now = Date.now()): { text: string; expired: boolean } {
  const ms = new Date(isoEnd).getTime() - now;
  if (!Number.isFinite(ms) || ms <= 0) return { text: 'ya venció', expired: true };
  const minutes = Math.ceil(ms / 60_000);
  if (minutes < 60) return { text: `${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`, expired: false };
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return { text: `${hours} ${hours === 1 ? 'hora' : 'horas'}`, expired: false };
  const days = Math.floor(hours / 24);
  return { text: `${days} ${days === 1 ? 'día' : 'días'}`, expired: false };
}
