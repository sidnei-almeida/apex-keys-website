import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google";
import { ApiOriginPreconnect } from "@/components/layout/ApiOriginPreconnect";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { AppProviders } from "@/components/providers/AppProviders";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Apex Keys | Premium Steam Raffles",
  description:
    "Plataforma premium de sorteios de chaves Steam e jogos digitais. Participe com segurança e transparência.",
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0A0A0A",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${spaceGrotesk.variable} ${plusJakartaSans.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <head>
        <ApiOriginPreconnect />
      </head>
      <body
        className={`relative min-h-screen bg-premium-bg text-premium-text ${plusJakartaSans.className}`}
      >
        {/*
          Acentos fixos à viewport (não acompanham o scroll).
          overflow-x fica no wrapper interior — overflow no body quebrava position:fixed nalguns browsers.
        */}
        <div
          className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
          aria-hidden
        >
          {/* Brilho neutro mínimo — sem cor de marca, fundo #0A0A0A */}
          <div className="absolute -bottom-[10%] -right-[8%] h-[20rem] w-[20rem] sm:h-[24rem] sm:w-[24rem] bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.02)_0%,transparent_62%)]" />
        </div>

        <div className="relative z-0 flex min-h-screen flex-col overflow-x-clip">
          <AppProviders>
            <Header />
            <main className="relative z-10 flex-1 w-full px-0 pb-12 pt-0 md:pb-16">
              {children}
            </main>
            <Footer />
          </AppProviders>
        </div>
      </body>
    </html>
  );
}
