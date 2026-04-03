import type { Metadata } from "next";
import { FumadocsAssistantSidebar } from "opendetail-fumadocs/sidebar";
import type { ReactNode } from "react";
import "./globals.css";
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
    "OpenDetail marketing site, documentation, demo surface, and registry distribution in one app.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-white font-sans text-black antialiased">
        <FumadocsAssistantSidebar
          inputId="opendetail-site-question"
          knownSourcePageUrls={knownSourcePageUrls}
          persistence={{
            key: "opendetail-site-sidebar",
          }}
          placeholder="Ask AI anything..."
        >
          {children}
        </FumadocsAssistantSidebar>
      </body>
    </html>
  );
}
