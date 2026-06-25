import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Disclaimer } from "@/components/layout/Disclaimer";
import { AssistantSidebar } from "@/components/market/AssistantSidebar";

export const metadata: Metadata = {
  title: "Kalshi Research Assistant",
  description: "Prediction market research, analysis, and parlay combo builder powered by live Kalshi data.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full">
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-100">
        <Navbar />
        <main className="flex-1 pt-14">{children}</main>
        <Disclaimer />
        <AssistantSidebar />
      </body>
    </html>
  );
}
