import type { Metadata } from "next";
import type { ReactNode } from "react";

import { DocsDocumentScrollLock } from "@/components/docs-document-scroll-lock";
import { DocsPageShell } from "@/components/docs-page-shell";
import { DocsSearchRoot } from "@/components/docs-search-root";

import "./docs-shell.css";

export const metadata: Metadata = {
  title: {
    default: "OpenDetail Documentation",
    template: "%s | OpenDetail Documentation",
  },
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsSearchRoot>
      <DocsDocumentScrollLock />
      <DocsPageShell>{children}</DocsPageShell>
    </DocsSearchRoot>
  );
}
