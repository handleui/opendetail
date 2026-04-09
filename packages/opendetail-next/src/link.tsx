"use client";

import Link from "next/link";
import type { ReactNode } from "react";

const URL_PROTOCOL_REGEX = /^[a-z][a-z\d+\-.]*:/iu;
const SAFE_EXTERNAL_PROTOCOLS = new Set(["http:", "https:"]);

export interface NextSourceItem {
  id?: string;
  kind?: "local" | "page" | "remote";
  title: string;
  url: string;
}

export interface NextSourceTarget {
  external?: boolean;
  href: string;
}

export interface RenderNextSourceLinkProps {
  children: ReactNode;
  className?: string;
  source: NextSourceItem;
  target: NextSourceTarget;
  title?: string;
}

export type RenderNextSourceLink = (
  props: RenderNextSourceLinkProps
) => ReactNode;

const hasUrlProtocol = (value: string): boolean =>
  URL_PROTOCOL_REGEX.test(value);

const normalizeNextSourceHref = (href: string): string => href.trim();

export const isSafeNextSourceHref = (
  href: string,
  external?: boolean
): boolean => {
  const normalizedHref = normalizeNextSourceHref(href);

  if (!normalizedHref) {
    return false;
  }

  if (normalizedHref.startsWith("//")) {
    return false;
  }

  if (!hasUrlProtocol(normalizedHref)) {
    return true;
  }

  try {
    const parsedUrl = new URL(normalizedHref);

    if (external) {
      return SAFE_EXTERNAL_PROTOCOLS.has(parsedUrl.protocol);
    }

    return false;
  } catch {
    return false;
  }
};

export const renderNextSourceLink: RenderNextSourceLink = ({
  children,
  className,
  target,
  title,
}) => {
  const normalizedHref = normalizeNextSourceHref(target.href);

  if (!isSafeNextSourceHref(normalizedHref, target.external)) {
    return (
      <span className={className} title={title}>
        {children}
      </span>
    );
  }

  return target.external ? (
    <a
      className={className}
      href={normalizedHref}
      referrerPolicy="no-referrer"
      rel="noopener noreferrer"
      target="_blank"
      title={title}
    >
      {children}
    </a>
  ) : (
    <Link className={className} href={normalizedHref} title={title}>
      {children}
    </Link>
  );
};
