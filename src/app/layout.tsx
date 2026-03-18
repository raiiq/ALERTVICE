import type { Metadata } from "next";
import { Source_Serif_4, Libre_Franklin, IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";

// English body — Source Serif 4 (matches Reuters' editorial serif body text style)
const sourceSerif = Source_Serif_4({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["300", "400", "600", "700", "900"],
  style: ["normal", "italic"],
});

// English headlines — Libre Franklin (matches Reuters' Franklin Gothic condensed headline style)
const libreFranklin = Libre_Franklin({
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${sourceSerif.variable} ${libreFranklin.variable} ${ibmPlexArabic.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
