"use client";

import { useCallback, useRef } from "react";

/**
 * Sons discretos durante o giro (tick) e um toque final na vitória.
 * Usa Web Audio API — requer interação do utilizador antes (ex.: clique em Girar).
 */
export function useWheelSound() {
  const ctxRef = useRef<AudioContext | null>(null);

  const getCtx = useCallback(() => {
    if (typeof window === "undefined") return null;
    if (!ctxRef.current) {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return null;
      ctxRef.current = new Ctx();
    }
    return ctxRef.current;
  }, []);

  const resume = useCallback(async () => {
    const ctx = getCtx();
    if (ctx?.state === "suspended") await ctx.resume();
  }, [getCtx]);

  const playTick = useCallback(
    (intensity: number) => {
      const ctx = getCtx();
      if (!ctx) return;
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(520 + intensity * 180, t);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.045 + intensity * 0.04, t + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.07);
    },
    [getCtx],
  );

  const playWin = useCallback(() => {
    const ctx = getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    const freqs = [523.25, 659.25, 783.99];
    freqs.forEach((hz, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(hz, t + i * 0.08);
      g.gain.setValueAtTime(0, t + i * 0.08);
      g.gain.linearRampToValueAtTime(0.06, t + i * 0.08 + 0.04);
      g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.08 + 0.45);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(t + i * 0.08);
      osc.stop(t + i * 0.08 + 0.5);
    });
  }, [getCtx]);

  return { resume, playTick, playWin };
}
