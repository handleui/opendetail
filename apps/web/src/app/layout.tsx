import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { WebRootShell } from "@/components/web-root-shell";
import { knownSourcePageUrls } from "@/lib/known-source-page-urls";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-white font-sans text-neutral-900 tracking-tight antialiased">
        <WebRootShell knownSourcePageUrls={knownSourcePageUrls}>
          {children}
        </WebRootShell>
      </body>
    </html>
  );
}
