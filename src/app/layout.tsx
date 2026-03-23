import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { AppProviders } from "@/components/providers/AppProviders";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Apex Keys | Premium Steam Raffles",
  description:
    "Plataforma premium de sorteios de chaves Steam e jogos digitais. Participe com segurança e transparência.",
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0A111F",
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="relative flex min-h-screen flex-col bg-apex-bg text-apex-text overflow-x-hidden">
        {/* Spotlight 1 — ciano tático, canto superior esquerdo */}
        <div
          aria-hidden
          className="pointer-events-none fixed left-0 top-0 z-0 h-[700px] w-[700px] -translate-x-1/3 -translate-y-1/3"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(0,229,255,0.07) 0%, rgba(0,229,255,0.02) 40%, transparent 70%)",
          }}
        />
        {/* Spotlight 2 — âmbar tático, canto inferior direito */}
        <div
          aria-hidden
          className="pointer-events-none fixed bottom-0 right-0 z-0 h-[600px] w-[600px] translate-x-1/3 translate-y-1/3"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(255,179,0,0.055) 0%, rgba(255,179,0,0.015) 45%, transparent 70%)",
          }}
        />
        <AppProviders>
          <Header />
          <main className="relative z-10 flex-1 w-full px-4 pb-8 pt-6 sm:px-6 lg:px-8">
            {children}
          </main>
          <Footer />
        </AppProviders>
      </body>
    </html>
  );
}
