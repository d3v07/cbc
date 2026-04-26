import type { Metadata } from "next";
import { Playfair_Display, EB_Garamond, JetBrains_Mono, Special_Elite, Caveat, Fraunces } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair-display", display: "swap" });
const garamond = EB_Garamond({ subsets: ["latin"], variable: "--font-eb-garamond", display: "swap" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono", display: "swap" });
const specialElite = Special_Elite({ weight: "400", subsets: ["latin"], variable: "--font-special-elite", display: "swap" });
const caveat = Caveat({ subsets: ["latin"], variable: "--font-caveat", display: "swap" });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", display: "swap" });

export const metadata: Metadata = {
  title: "Mean It",
  description: "A guided writing companion. Every word is yours.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`theme-quiet ${playfair.variable} ${garamond.variable} ${jetbrains.variable} ${specialElite.variable} ${caveat.variable} ${fraunces.variable}`}>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
