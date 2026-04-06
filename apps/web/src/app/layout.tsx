import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";
import { WebRootShell } from "@/components/web-root-shell";
import { knownSourcePageUrls } from "@/lib/known-source-page-urls";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

const metadataBase = (() => {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  try {
    return new URL(siteUrl);
  } catch {
    return new URL("http://localhost:3000");
  }
})();

export const metadata: Metadata = {
  metadataBase,
  title: {
    default: "OpenDetail",
    template: "%s | OpenDetail",
  },
  description:
    "OpenDetail marketing site, documentation, and registry distribution in one app.",
};

/** Reduces iOS Safari shifting the layout when the keyboard opens (pairs with input font-size rules). */
export const viewport: Viewport = {
  initialScale: 1,
  interactiveWidget: "overlays-content",
  width: "device-width",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html
      className={`${geistSans.variable} ${geistMono.variable}`}
      lang="en"
      suppressHydrationWarning
    >
      <body
        className={`${geistSans.className} min-h-screen bg-white font-sans text-neutral-900 tracking-tight antialiased`}
      >
        <WebRootShell knownSourcePageUrls={knownSourcePageUrls}>
          {children}
        </WebRootShell>
      </body>
    </html>
  );
}
