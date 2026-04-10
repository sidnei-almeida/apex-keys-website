/** Fuso usado em copy e countdowns exibidos ao utilizador (Brasil). */
export const BRASILIA_TIMEZONE = "America/Sao_Paulo";

/** Hora HH:MM em Brasília a partir de um instante ISO (UTC) da API. */
export function formatBrasiliaHm(iso: string | null | undefined): string | null {
  if (!iso?.trim()) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleTimeString("pt-BR", {
    timeZone: BRASILIA_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}
