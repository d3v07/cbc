import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
