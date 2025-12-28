import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
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
  title: "Portal de Monitoreo ETL | Transperuana",
  description: "Sistema de monitoreo y gestión de tramas SCTR/VIDA LEY - Transperuana Corredores de Seguros S.A.",
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
          <Header />
          <Sidebar />
          <main className="ml-64 mt-16 min-h-[calc(100vh-4rem)] p-6 transition-all duration-300">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
