import { RootProvider } from "fumadocs-ui/provider/next";
import type { Metadata } from "next";
import "./global.css";
import { Inter } from "next/font/google";
import { DocsAssistantShell } from "@/components/docs-assistant-shell";

const inter = Inter({
  subsets: ["latin"],
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
    default: "OpenDetail Docs",
    template: "%s | OpenDetail Docs",
  },
  description:
    "OpenDetail documentation for setup, configuration, runtime usage, and registry integrations.",
};

export default function Layout({ children }: LayoutProps<"/">) {
  return (
    <html className={inter.className} lang="en" suppressHydrationWarning>
      <body className="flex min-h-screen flex-col">
        <RootProvider>
          <DocsAssistantShell>{children}</DocsAssistantShell>
        </RootProvider>
      </body>
    </html>
  );
}
