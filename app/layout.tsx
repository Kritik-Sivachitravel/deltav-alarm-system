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
  title: "DeltaV Shift Handoff Copilot | Riverside Cogeneration",
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        <div className="w-full bg-slate-800 px-4 py-1.5 text-center text-[11px] text-slate-400 tracking-wide">
          Independent concept study based on public DeltaV product documentation · Read-only operator workflow · Not affiliated with Emerson
        </div>
        <NavBar />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-slate-200 px-4 py-3 text-center text-xs text-slate-400">
          Independent concept study · DeltaV Shift Handoff Copilot · Built by Kritik Sivachitravel
        </footer>
      </body>
    </html>
  );
}
