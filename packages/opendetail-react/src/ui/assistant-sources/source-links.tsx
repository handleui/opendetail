import type { ReactNode } from "react";

const URL_PROTOCOL_REGEX = /^[a-z][a-z\d+\-.]*:/iu;
const SAFE_EXTERNAL_PROTOCOLS = new Set(["http:", "https:"]);

export interface AssistantSourceItem {
  id?: string;
  kind?: "local" | "remote";
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

export const isSafeAssistantSourceHref = (
  href: string,
  external?: boolean
): boolean => {
  if (!href) {
    return false;
  }

  if (!hasUrlProtocol(href)) {
    return true;
  }

  try {
    const parsedUrl = new URL(href);

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

  if (
    source.url.startsWith("/") ||
    source.url.startsWith("./") ||
    source.url.startsWith("../")
  ) {
    return {
      external: false,
      href: source.url,
    };
  }

  if (hasUrlProtocol(source.url)) {
    return null;
  }

  if (source.url.length === 0) {
    return null;
  }

  return {
    external: false,
    href: source.url,
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
  if (!isSafeAssistantSourceHref(target.href, target.external)) {
    return (
      <span className={className} title={title}>
        {children}
      </span>
    );
  }

  return (
    <a
      className={className}
      href={target.href}
      referrerPolicy={target.external ? "no-referrer" : undefined}
      rel={target.external ? "noopener noreferrer" : undefined}
      target={target.external ? "_blank" : undefined}
      title={title}
    >
      {children}
    </a>
  );
};
