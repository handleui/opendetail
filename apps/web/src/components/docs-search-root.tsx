"use client";

import { RootProvider } from "fumadocs-ui/provider/next";
import type { ReactNode } from "react";

/**
 * Fumadocs {@link RootProvider}: Next.js framework context + official search stack
 * (lazy {@link DefaultSearchDialog}, Orama via `/api/search`).
 */
export function DocsSearchRoot({ children }: { children: ReactNode }) {
  return (
    <RootProvider
      search={{
        options: {
          api: "/api/search",
          type: "fetch",
        },
      }}
      theme={{ enabled: false }}
    >
      {children}
    </RootProvider>
  );
}
