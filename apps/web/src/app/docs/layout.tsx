import type { ReactNode } from "react";

import { DocsPageShell } from "@/components/docs-page-shell";

import "./docs-shell.css";

export default function Layout({ children }: { children: ReactNode }) {
  return <DocsPageShell>{children}</DocsPageShell>;
}
