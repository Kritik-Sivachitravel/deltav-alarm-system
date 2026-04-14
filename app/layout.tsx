import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NavBar from "@/components/NavBar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DeltaV Alarm Triage Assistant | Riverside Cogeneration",
  description:
    "Decision-support layer for industrial control system alarm management. Concept prototype inspired by ISA-18.2.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-100">
        <NavBar />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-zinc-800 px-4 py-3 text-center text-xs text-zinc-600">
          Concept prototype · Not affiliated with Emerson Electric Co. · Built
          by Kritik Sivachitravel
        </footer>
      </body>
    </html>
  );
}
