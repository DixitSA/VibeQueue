import type { Metadata, Viewport } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "VibeQueue | Real-time Crowd Jukebox",
  description: "Request and upvote songs in real-time at your favorite venues.",
};

export const viewport: Viewport = {
  themeColor: "#1C1C1C",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable} h-full`}>
      <body className="antialiased h-full">
        {/* Mobile viewport container */}
        <div className="mx-auto min-h-full max-w-md bg-charcoal shadow-2xl relative flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
