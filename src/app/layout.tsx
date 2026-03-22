import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Header from "@/components/layout/Header";
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
  themeColor: "#040B16",
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
      <body className="min-h-full flex flex-col bg-apex-bg text-apex-text">
        <AppProviders>
          <Header />
          <main className="flex-1 w-full px-4 pb-8 pt-6 sm:px-6 lg:px-8">
            {children}
          </main>
        </AppProviders>
      </body>
    </html>
  );
}
