/**
 * Nomes reais dos ficheiros em `public/music/` (sincronizar com a pasta ao mudar faixas).
 * Usado como fallback se o fetch a `/api/roulette-music/tracks` falhar.
 * Em condições normais a API lista `public/music/*.mp3` automaticamente.
 */
export const ROULETTE_MUSIC_TRACKS_FALLBACK: readonly string[] = [
  "/music/audioatlant-total-war-epic-action-cinematic-trailer-main-513668.mp3",
  "/music/cscprod-rising-dominion-275776.mp3",
  "/music/kornevmusic-epic-war-trailer-428423.mp3",
  "/music/leberch-epic-510230.mp3",
  "/music/litesaturation-trailer-15322.mp3",
  "/music/mfcc-epic-background-music-499468.mp3",
  "/music/nastelbom-epic-cinematic-2-513436.mp3",
  "/music/the_mountain-epic-483805.mp3",
];
