// ============================================================
// app/layout.tsx – Root layout
// ============================================================
import type { Metadata } from "next";
import { Syne, DM_Sans, DM_Mono } from "next/font/google";
import "./globals.css";

const display = Syne({ subsets: ["latin"], variable: "--font-display", weight: ["400","500","600","700","800"] });
const body = DM_Sans({ subsets: ["latin"], variable: "--font-body", weight: ["300","400","500","600"] });
const mono = DM_Mono({ subsets: ["latin"], variable: "--font-mono", weight: ["300","400","500"] });

export const metadata: Metadata = {
  title: "Calorify – Track what you eat",
  description: "Simple, beautiful calorie tracking. Log meals, burn calories, see your progress.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body className="bg-surface-1 font-sans text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}
