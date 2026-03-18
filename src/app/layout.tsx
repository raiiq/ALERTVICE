import type { Metadata } from "next";
import { Libre_Franklin, IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";

// Universal English font — Libre Franklin (Tactical/News style)
const libreFranklin = Libre_Franklin({
  variable: "--font-roboto", // Used as the primary base font
  subsets: ["latin"],
  weight: ["300", "400", "600", "700", "800", "900"],
  style: ["normal", "italic"],
});

// Secondary variable for consistency with existing css classes
const libreFranklinCondensed = Libre_Franklin({
  variable: "--font-condensed",
  subsets: ["latin"],
  weight: ["300", "400", "600", "700", "800", "900"],
  style: ["normal", "italic"],
});

// Arabic — IBM Plex Sans Arabic (Sky News Arabia style)
const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic"],
  weight: ["300", "400", "600", "700"],
});

export const metadata: Metadata = {
  title: "Alertvice News",
  description: "Live news updates from Telegram",
};

import HealthCheck from "./components/HealthCheck";
import { LanguageProvider } from "./context/LanguageContext";
import Navbar from "./components/Navbar";
import GlobalSignals from "./components/GlobalSignals";
import TranslationLoader from "./components/TranslationLoader";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${libreFranklin.variable} ${libreFranklinCondensed.variable} ${ibmPlexArabic.variable} antialiased bg-background`}
      >
        <LanguageProvider>
          <div className="bg-pulse-overlay">
            <div className="pulse-blob-1"></div>
            <div className="pulse-blob-2"></div>
          </div>
          <TranslationLoader />
          <Navbar />
          <GlobalSignals />
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
