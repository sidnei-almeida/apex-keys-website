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
      colors: {
        "apex-bg": "#040B16",
        "apex-surface": "#0B1B36",
        "apex-primary": "#004DE6",
        "apex-accent": "#00D4FF",
        "apex-text": "#F0F4F8",
        "apex-success": "#34D399",
      },
    },
  },
};

export default config;
