import type { ReactNode } from "react";

const URL_PROTOCOL_REGEX = /^[a-z][a-z\d+\-.]*:/iu;
const SAFE_EXTERNAL_PROTOCOLS = new Set(["http:", "https:"]);

export interface AssistantSourceItem {
  id?: string;
  kind?: "local" | "page" | "remote";
  title: string;
  url: string;
}

export interface AssistantSourceTarget {
  external?: boolean;
  href: string;
}

export interface RenderAssistantSourceLinkProps {
  children: ReactNode;
  className?: string;
  source: AssistantSourceItem;
  target: AssistantSourceTarget;
  title?: string;
}

export type ResolveAssistantSourceTarget = (
  source: AssistantSourceItem
) => AssistantSourceTarget | null;

export type RenderAssistantSourceLink = (
  props: RenderAssistantSourceLinkProps
) => ReactNode;

const hasUrlProtocol = (value: string): boolean =>
  URL_PROTOCOL_REGEX.test(value);

const normalizeAssistantSourceHref = (href: string): string => href.trim();

export const isSafeAssistantSourceHref = (
  href: string,
  external?: boolean
): boolean => {
  const normalizedHref = normalizeAssistantSourceHref(href);

  if (!normalizedHref) {
    return false;
  }

  // Reject protocol-relative URLs (`//evil.example`) — they are not same-origin paths.
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

export const getDefaultAssistantSourceTarget = (
  source: AssistantSourceItem
): AssistantSourceTarget | null => {
  if (source.kind === "remote") {
    try {
      const parsedUrl = new URL(source.url);

      if (parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:") {
        return {
          external: true,
          href: source.url,
        };
      }

      return null;
    } catch {
      return null;
    }
  }

  const url = normalizeAssistantSourceHref(source.url);

  if (
    (url.startsWith("/") || url.startsWith("./") || url.startsWith("../")) &&
    !url.startsWith("//")
  ) {
    return {
      external: false,
      href: url,
    };
  }

  if (hasUrlProtocol(url)) {
    return null;
  }

  if (url.length === 0) {
    return null;
  }

  if (url.startsWith("//")) {
    return null;
  }

  return {
    external: false,
    href: url,
  };
};

export const resolveAssistantSourceTarget = ({
  resolveSourceTarget,
  source,
}: {
  resolveSourceTarget?: ResolveAssistantSourceTarget;
  source: AssistantSourceItem;
}): AssistantSourceTarget | null =>
  resolveSourceTarget?.(source) ?? getDefaultAssistantSourceTarget(source);

export const renderAssistantSourceLink = ({
  className,
  children,
  source: _source,
  target,
  title,
}: RenderAssistantSourceLinkProps) => {
  const normalizedHref = normalizeAssistantSourceHref(target.href);

  if (!isSafeAssistantSourceHref(normalizedHref, target.external)) {
    return (
      <span className={className} title={title}>
        {children}
      </span>
    );
  }

  return (
    <a
      className={className}
      href={normalizedHref}
      referrerPolicy={target.external ? "no-referrer" : undefined}
      rel={target.external ? "noopener noreferrer" : undefined}
      target={target.external ? "_blank" : undefined}
      title={title}
    >
      {children}
    </a>
  );
};
