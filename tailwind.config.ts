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
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        /** Base – Deep Space Navy */
        "apex-bg": "#0A111F",
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
      },
    },
  },
};

export default config;
