import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { FumadocsAssistantSidebar } from "opendetail-fumadocs/sidebar";
import type { ReactNode } from "react";
import "./globals.css";
import { knownSourcePageUrls } from "@/lib/source";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
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
    "OpenDetail marketing site, documentation, demo surface, and registry distribution in one app.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geist.variable} bg-white font-sans text-black antialiased [--font-sans:var(--font-geist)]`}
      >
        <FumadocsAssistantSidebar
          emptyState="Ask the docs"
          inputId="opendetail-site-question"
          knownSourcePageUrls={knownSourcePageUrls}
          persistence={{
            key: "opendetail-site-sidebar",
          }}
          placeholder="Ask about these docs"
        >
          {children}
        </FumadocsAssistantSidebar>
      </body>
    </html>
  );
}
