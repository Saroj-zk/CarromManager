import type { Metadata, Viewport } from "next";
import "./globals.css";
import { TournamentProvider } from "@/context/TournamentContext";

export const metadata: Metadata = {
  title: "Pocket Masters Carrom Championship 2026",
  description: "Official Tournament Dashboard for the Pocket Masters Carrom Championship 2026 - Every Strike Counts.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col antialiased">
        <TournamentProvider>
          {children}
        </TournamentProvider>
      </body>
    </html>
  );
}
