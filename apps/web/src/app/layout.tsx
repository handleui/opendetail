import type { Metadata } from "next";
import { Geist } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";
import { AssistantSidebarShell } from "../../../../registry/blocks/assistant-sidebar-shell/assistant-sidebar-shell";

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
        <AssistantSidebarShell
          emptyState="Ask the docs"
          inputId="opendetail-site-question"
          persistence={{
            key: "opendetail-site-sidebar",
          }}
          placeholder="Ask about these docs"
        >
          {children}
        </AssistantSidebarShell>
      </body>
    </html>
  );
}
