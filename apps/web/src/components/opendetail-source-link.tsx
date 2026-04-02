"use client";

import Link from "next/link";
import type { RenderAssistantSourceLink } from "@/registry/ui/assistant-sources/source-links";

export const renderFumadocsSourceLink: RenderAssistantSourceLink = ({
  children,
  className,
  target,
  title,
}) =>
  target.external ? (
    <a
      className={className}
      href={target.href}
      rel="noopener noreferrer"
      target="_blank"
      title={title}
    >
      {children}
    </a>
  ) : (
    <Link className={className} href={target.href} title={title}>
      {children}
    </Link>
  );
