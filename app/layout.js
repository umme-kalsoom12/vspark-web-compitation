import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import TopLoadingBar from "./components/TopLoadingBar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "VSPARK 2026 | National Web Development Hackathon & Project Portal",
  description:
    "Official portal for VSPARK Web Development Competition at COMSATS University Vehari. Register, build, submit, and compete for top honors.",
  keywords: ["hackathon", "web development", "competition", "nextjs", "react", "comsats", "vspark"],
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased selection:bg-blue-600 selection:text-white`}
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col font-sans bg-slate-50 text-slate-900">
        <Suspense fallback={null}>
          <TopLoadingBar />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
