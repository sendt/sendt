import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CanoApp - Canlı Mezat Platformu",
  description: "Türkiye'nin canlı yayın mezat platformu. Canlı yayınlarda açık artırma ile alışveriş yap.",
  keywords: "canlı yayın, mezat, açık artırma, alışveriş, online mezat",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-gray-950 text-white">
        <Navbar />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
