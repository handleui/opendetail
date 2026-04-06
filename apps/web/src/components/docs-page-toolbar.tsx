"use client";

import { DocsPageActions } from "@/components/docs-page-actions";

export function DocsPageToolbar({
  markdownUrl,
  githubUrl,
  className,
}: {
  markdownUrl: string;
  githubUrl: string;
  className?: string;
}) {
  return (
    <DocsPageActions
      className={className}
      githubUrl={githubUrl}
      layout="row"
      markdownUrl={markdownUrl}
    />
  );
}
