import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ToasterProvider } from "@/components/ToasterProvider";
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
  title: "RICE COOKER — Simulateur de risque de projet numérique",
  description:
    "Évaluez en quelques minutes le risque de développement de votre idée de produit numérique et repartez avec un diagnostic lisible et des recommandations actionnables.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <ToasterProvider />
      </body>
    </html>
  );
}
