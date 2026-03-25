import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/hooks/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-body)", "ui-sans-serif", "system-ui", "sans-serif"],
        heading: [
          "var(--font-heading)",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
        body: ["var(--font-body)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      colors: {
        /** Base – Deep Space Navy */
        "apex-bg": "#0A111F",
        /** Alias semântico (fundo plataforma / máscaras) */
        "apex-base": "#0A111F",
        /** Superfície – Strategic Slate */
        "apex-surface": "#111A2E",
        /** Azul cobalto (bordas estruturais, hover estados) */
        "apex-primary": "#004DE6",
        /** Ciano refinado Tático – acento principal */
        "apex-accent": "#00E5FF",
        /** Âmbar tático – acento secundário / avisos */
        "apex-secondary": "#FFB300",
        /** Texto de precisão – Ice White */
        "apex-text": "#F0F4FF",
        /** Texto muted – Steel Blue-Gray */
        "apex-text-muted": "#A1AABF",
        /** Sucesso / progresso */
        "apex-success": "#34D399",

        /**
         * Premium Dark — detalhe de rifa (cinema / streaming / IMDb-like).
         * Uso cirúrgico de `premium-accent` (ouro) em CTA e estados-chave.
         */
        "premium-bg": "#0A0A0A",
        "premium-surface": "#161616",
        "premium-border": "#2A2A2A",
        "premium-cell": "#202020",
        "premium-accent": "#D4AF37",
        "premium-accent-amber": "#F5A623",
        "premium-text": "#F3F4F6",
        "premium-muted": "#9CA3AF",
      },
    },
  },
};

export default config;
