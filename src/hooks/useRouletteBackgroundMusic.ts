"use client";

import { ROULETTE_MUSIC_TRACKS_FALLBACK } from "@/lib/roulette-music-tracks";
import { useCallback, useEffect, useRef, useState } from "react";

const LOG = "[roulette-music]";
const TARGET_VOLUME = 0.2;
const FADE_IN_MS = 1800;
const FADE_OUT_MS = 1400;

function pickRandomTrack(tracks: readonly string[], exclude: string | null): string | null {
  if (tracks.length === 0) return null;
  if (tracks.length === 1) return tracks[0] ?? null;
  const pool = exclude != null ? tracks.filter((t) => t !== exclude) : [...tracks];
  const usePool = pool.length > 0 ? pool : [...tracks];
  return usePool[Math.floor(Math.random() * usePool.length)] ?? null;
}

/** `MediaError.message` costuma vir vazio; o código e o estado do elemento explicam o falhanço. */
function describeAudioFailure(el: HTMLAudioElement): string {
  const err = el.error;
  const code = err?.code;
  const byCode: Record<number, string> = {
    1: "MEDIA_ERR_ABORTED (leitura abortada)",
    2: "MEDIA_ERR_NETWORK (rede / 404 / falha ao obter o ficheiro)",
    3: "MEDIA_ERR_DECODE (ficheiro corrompido ou formato inválido)",
    4: "MEDIA_ERR_SRC_NOT_SUPPORTED (formato ou URL não suportado)",
  };
  const label =
    code != null ? (byCode[code] ?? `MediaError code ${code}`) : "sem objeto MediaError (erro desconhecido)";

  const net = ["EMPTY", "IDLE", "LOADING", "NO_SOURCE"][el.networkState] ?? String(el.networkState);
  const src = el.currentSrc || el.src || "(sem src)";
  const msg = err?.message?.trim();
  const detail = msg ? ` — ${msg}` : "";
  return `${label} | networkState=${net} (${el.networkState}) | src=${src}${detail}`;
}

/**
 * Música de fundo da roleta: uma instância estável (`useRef`), lista de faixas via
 * `/api/roulette-music/tracks` com fallback estático.
 */
export function useRouletteBackgroundMusic(
  shouldPlay: boolean,
  opts?: { disabled?: boolean },
) {
  const disabled = opts?.disabled ?? false;
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastTrackRef = useRef<string | null>(null);
  const fadeRafRef = useRef<number | null>(null);
  const gestureCleanupRef = useRef<(() => void) | null>(null);
  const startLockRef = useRef(false);

  const [trackList, setTrackList] = useState<string[]>([]);

  const cancelFade = useCallback(() => {
    if (fadeRafRef.current != null) {
      cancelAnimationFrame(fadeRafRef.current);
      fadeRafRef.current = null;
    }
  }, []);

  const clearGestureListeners = useCallback(() => {
    gestureCleanupRef.current?.();
    gestureCleanupRef.current = null;
  }, []);

  const fadeVolume = useCallback(
    (el: HTMLAudioElement, from: number, to: number, durationMs: number, onDone?: () => void) => {
      cancelFade();
      const t0 = performance.now();
      const step = (now: number) => {
        const p = durationMs <= 0 ? 1 : Math.min(1, (now - t0) / durationMs);
        el.volume = from + (to - from) * p;
        if (p < 1) {
          fadeRafRef.current = requestAnimationFrame(step);
        } else {
          fadeRafRef.current = null;
          onDone?.();
        }
      };
      fadeRafRef.current = requestAnimationFrame(step);
    },
    [cancelFade],
  );

  const stopPlayback = useCallback(
    (fadeOutMs: number) => {
      clearGestureListeners();
      const el = audioRef.current;
      if (!el) return;
      cancelFade();
      const startVol = el.volume;
      if (fadeOutMs <= 0 || startVol <= 0.001) {
        try {
          el.pause();
          el.removeAttribute("src");
          el.load();
        } catch {
          /* ignore */
        }
        audioRef.current = null;
        console.log(`${LOG} stop (immediate)`);
        return;
      }
      fadeVolume(el, startVol, 0, fadeOutMs, () => {
        if (audioRef.current !== el) return;
        try {
          el.pause();
          el.removeAttribute("src");
          el.load();
        } catch {
          /* ignore */
        }
        audioRef.current = null;
        console.log(`${LOG} stop (fade complete)`);
      });
    },
    [cancelFade, clearGestureListeners, fadeVolume],
  );

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const res = await fetch("/api/roulette-music/tracks", { cache: "no-store" });
        const body = (await res.json()) as { tracks?: unknown };
        const fromApi = Array.isArray(body.tracks)
          ? body.tracks.filter((u): u is string => typeof u === "string" && u.length > 0)
          : [];
        if (!alive) return;
        if (fromApi.length > 0) {
          console.log(`${LOG} tracks from API (${fromApi.length}):`, fromApi);
          setTrackList(fromApi);
        } else if (ROULETTE_MUSIC_TRACKS_FALLBACK.length > 0) {
          console.warn(
            `${LOG} pasta public/music sem .mp3; a usar lista manual ROULETTE_MUSIC_TRACKS_FALLBACK:`,
            ROULETTE_MUSIC_TRACKS_FALLBACK,
          );
          setTrackList([...ROULETTE_MUSIC_TRACKS_FALLBACK]);
        } else {
          console.warn(
            `${LOG} sem faixas: adiciona ficheiros .mp3 a public/music/ (a API lista-os automaticamente) ou define paths em roulette-music-tracks.ts`,
          );
          setTrackList([]);
        }
      } catch (e) {
        if (!alive) return;
        console.warn(`${LOG} fetch /api/roulette-music/tracks failed`, e);
        if (ROULETTE_MUSIC_TRACKS_FALLBACK.length > 0) {
          setTrackList([...ROULETTE_MUSIC_TRACKS_FALLBACK]);
        } else {
          setTrackList([]);
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const installGestureResume = useCallback(
    (el: HTMLAudioElement) => {
      clearGestureListeners();
      const onGesture = () => {
        void (async () => {
          const a = audioRef.current;
          if (a !== el || !a.paused) {
            clearGestureListeners();
            return;
          }
          try {
            await a.play();
            console.log(`${LOG} play success after user gesture`);
            fadeVolume(a, a.volume, TARGET_VOLUME, FADE_IN_MS);
          } catch (err) {
            console.warn(`${LOG} play failed after gesture`, err);
          }
          clearGestureListeners();
        })();
      };
      document.addEventListener("pointerdown", onGesture, { passive: true });
      document.addEventListener("keydown", onGesture);
      gestureCleanupRef.current = () => {
        document.removeEventListener("pointerdown", onGesture);
        document.removeEventListener("keydown", onGesture);
      };
      console.log(`${LOG} waiting for user gesture (pointer/key) to unlock audio`);
    },
    [clearGestureListeners, fadeVolume],
  );

  const startPlayback = useCallback(async () => {
    if (startLockRef.current) {
      console.log(`${LOG} startPlayback skipped (already starting)`);
      return;
    }

    const tracks =
      trackList.length > 0 ? trackList : [...ROULETTE_MUSIC_TRACKS_FALLBACK];
    if (tracks.length === 0) {
      console.warn(`${LOG} startPlayback: no tracks`);
      return;
    }

    const existing = audioRef.current;
    if (existing && !existing.paused) {
      console.log(`${LOG} already playing, skip`, existing.src);
      return;
    }

    if (existing && existing.paused) {
      try {
        await existing.play();
        console.log(`${LOG} resumed paused instance`, existing.src);
        fadeVolume(existing, existing.volume, TARGET_VOLUME, FADE_IN_MS);
        return;
      } catch (err) {
        console.warn(`${LOG} resume failed`, err);
        installGestureResume(existing);
        return;
      }
    }

    startLockRef.current = true;
    cancelFade();
    clearGestureListeners();

    const src = pickRandomTrack(tracks, lastTrackRef.current);
    if (!src) {
      console.warn(`${LOG} pickRandomTrack returned null`);
      startLockRef.current = false;
      return;
    }

    const absUrl =
      typeof window !== "undefined" ? new URL(src, window.location.origin).href : src;
    console.log(`${LOG} timer / shouldPlay → selected track:`, src, "→", absUrl);

    const el = new Audio(src);
    el.loop = true;
    el.preload = "auto";
    el.volume = 0;
    audioRef.current = el;
    lastTrackRef.current = src;

    el.addEventListener(
      "error",
      () => {
        const summary = describeAudioFailure(el);
        console.error(`${LOG} media error: ${summary}`);
        clearGestureListeners();
        cancelFade();
        try {
          el.pause();
          el.removeAttribute("src");
          el.load();
        } catch {
          /* ignore */
        }
        if (audioRef.current === el) audioRef.current = null;
      },
      { once: true },
    );

    el.addEventListener(
      "canplaythrough",
      () => {
        console.log(`${LOG} canplaythrough`, el.src);
      },
      { once: true },
    );

    try {
      await el.play();
      console.log(`${LOG} play() succeeded`, el.src);
      fadeVolume(el, 0, TARGET_VOLUME, FADE_IN_MS);
    } catch (err) {
      console.warn(`${LOG} play() blocked or failed (autoplay policy?)`, err);
      el.volume = TARGET_VOLUME;
      installGestureResume(el);
    } finally {
      startLockRef.current = false;
    }
  }, [
    trackList,
    cancelFade,
    clearGestureListeners,
    fadeVolume,
    installGestureResume,
  ]);

  useEffect(() => {
    console.log(`${LOG} state`, { shouldPlay, disabled, trackListLength: trackList.length });

    if (disabled) {
      stopPlayback(600);
      return;
    }

    if (!shouldPlay) {
      stopPlayback(FADE_OUT_MS);
      return;
    }

    if (trackList.length === 0 && ROULETTE_MUSIC_TRACKS_FALLBACK.length === 0) {
      console.warn(`${LOG} shouldPlay but no tracks yet (waiting for fetch)`);
      return;
    }

    void startPlayback();
  }, [shouldPlay, disabled, trackList, startPlayback, stopPlayback]);

  useEffect(() => {
    return () => {
      stopPlayback(800);
    };
  }, [stopPlayback]);
}
