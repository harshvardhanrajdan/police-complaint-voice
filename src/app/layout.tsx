import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppShell } from "@/components/AppShell";
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
  title: "पुलिस शिकायत सहायता | नागरिक ई-सेवा",
  description:
    "थाने में प्रस्तुत करने हेतु शिकायत का मसौदा। विवरण व तथ्यों का कथन दर्ज करें। हिंदी व अंग्रेज़ी समर्थित।",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="hi"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      style={{ colorScheme: "only light" }}
    >
      <head>
        <meta name="color-scheme" content="only light" />
      </head>
      <body className="flex min-h-full flex-col bg-[#f0f3f8] text-slate-900">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
