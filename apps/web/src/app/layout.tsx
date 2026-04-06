import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import type { ReactNode } from "react";
import "./globals.css";
import { WebRootShell } from "@/components/web-root-shell";
import { getDocsSidebarSections } from "@/lib/docs-sidebar-sections";
import { knownSourcePageUrls } from "@/lib/known-source-page-urls";
import { SANDBOX_PREVIEW_DOCUMENT_HEADER } from "@/lib/ui-sandbox/paths";
import { getUiSidebarSections } from "@/lib/ui-sidebar-sections";

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
  icons: {
    icon: "/favicon.png",
  },
};

/** Reduces iOS Safari shifting the layout when the keyboard opens (pairs with input font-size rules). */
export const viewport: Viewport = {
  initialScale: 1,
  interactiveWidget: "overlays-content",
  width: "device-width",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const headerList = await headers();
  const isSandboxPreviewDocument =
    headerList.get(SANDBOX_PREVIEW_DOCUMENT_HEADER) === "1";

  if (isSandboxPreviewDocument) {
    return (
      <html
        className={`${geistSans.variable} ${geistMono.variable} h-full`}
        lang="en"
        suppressHydrationWarning
      >
        <body
          className={`${geistSans.className} m-0 h-full min-h-0 bg-white font-sans text-neutral-900 tracking-tight antialiased`}
        >
          {children}
        </body>
      </html>
    );
  }

  const docsSidebarSections = getDocsSidebarSections();
  const uiSidebarSections = getUiSidebarSections();

  return (
    <html
      className={`${geistSans.variable} ${geistMono.variable}`}
      lang="en"
      suppressHydrationWarning
    >
      <body
        className={`${geistSans.className} min-h-screen bg-white font-sans text-neutral-900 tracking-tight antialiased`}
      >
        <WebRootShell
          docsSidebarSections={docsSidebarSections}
          knownSourcePageUrls={knownSourcePageUrls}
          uiSidebarSections={uiSidebarSections}
        >
          {children}
        </WebRootShell>
      </body>
    </html>
  );
}
