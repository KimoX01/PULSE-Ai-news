import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Pulse — What Actually Matters",
  description: "World events, science, tech, climate, health, ideas. Curated signal, no social noise.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <head>
        {/* Prevent theme flash — runs before React hydrates */}
        <script suppressHydrationWarning dangerouslySetInnerHTML={{ __html: `try{document.documentElement.setAttribute('data-theme',localStorage.getItem('pulse_theme')||'dark')}catch(e){}` }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
