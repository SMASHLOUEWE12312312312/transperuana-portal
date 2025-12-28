import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Transperuana | Portal de Monitoreo ETL",
  description: "Sistema de Renovaciones SCTR / Vida Ley - Transperuana Corredores de Seguros S.A.",
  keywords: ["Transperuana", "SCTR", "VIDA LEY", "ETL", "Seguros", "Monitoreo"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${inter.variable} ${plusJakarta.variable} ${jetbrainsMono.variable} antialiased`}
        style={{ fontFamily: 'var(--font-inter), sans-serif' }}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
