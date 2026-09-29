import type { Metadata, Viewport } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import "./globals.css";

// Self-hosted (no build-time call to Google Fonts).

export const metadata: Metadata = {
  title: { default: "Helios — Digital gym layer for commercial fitness", template: "%s · Helios" },
  description:
    "Helios turns the equipment installed in a fitness room into a digital gym residents can actually use. Discovery demo.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#f5f3ee",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
