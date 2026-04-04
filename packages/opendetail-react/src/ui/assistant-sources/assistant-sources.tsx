"use client";

import { ArrowRight, FileText, Globe } from "lucide-react";
import { useId, useMemo, useState } from "react";
import {
  type AssistantSourceItem,
  type AssistantSourceTarget,
  type RenderAssistantSourceLink,
  type ResolveAssistantSourceTarget,
  renderAssistantSourceLink,
  resolveAssistantSourceTarget,
} from "./source-links";

export type { AssistantSourceItem } from "./source-links";

export interface AssistantSourcesProps {
  className?: string;
  count?: number;
  countLabel?: string;
  defaultOpen?: boolean;
  id?: string;
  items?: AssistantSourceItem[];
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
  renderSourceLink?: RenderAssistantSourceLink;
  resolveSourceTarget?: ResolveAssistantSourceTarget;
}

const getClassName = (className?: string): string =>
  ["opendetail-sources", className].filter(Boolean).join(" ");

const getHttpFaviconUrl = (href: string): string | null => {
  try {
    const parsed = new URL(href);

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }

    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(parsed.hostname)}&sz=32`;
  } catch {
    return null;
  }
};

const RemotePillFavicon = ({ href }: { href: string }) => {
  const [failed, setFailed] = useState(false);
  const faviconUrl = useMemo(() => getHttpFaviconUrl(href), [href]);

  if (failed || !faviconUrl) {
    return (
      <span aria-hidden="true" className="opendetail-sources__pill-icon">
        <Globe
          className="opendetail-sources__pill-icon-svg"
          size={14}
          strokeWidth={1.6}
        />
      </span>
    );
  }

  return (
    <span aria-hidden="true" className="opendetail-sources__pill-icon">
      {/* biome-ignore lint/a11y/noNoninteractiveElementInteractions: swap to Globe when favicon fails to load */}
      <img
        alt=""
        className="opendetail-sources__pill-favicon"
        decoding="async"
        height={14}
        loading="lazy"
        onError={() => setFailed(true)}
        src={faviconUrl}
        width={14}
      />
    </span>
  );
};

const SourcePillLeading = ({
  item,
  target,
}: {
  item: AssistantSourceItem;
  target: AssistantSourceTarget | null;
}) => {
  if (item.kind === "remote") {
    const href = target?.href ?? item.url;

    return <RemotePillFavicon href={href} />;
  }

  return (
    <span aria-hidden="true" className="opendetail-sources__pill-icon">
      <FileText
        className="opendetail-sources__pill-icon-svg"
        size={14}
        strokeWidth={1.6}
      />
    </span>
  );
};

const getCountLabel = ({
  count,
  countLabel,
}: {
  count: number;
  countLabel?: string;
}): string | null => {
  if (countLabel) {
    return countLabel;
  }

  if (count <= 0) {
    return null;
  }

  return `${count} source${count === 1 ? "" : "s"}`;
};

export const AssistantSources = ({
  className,
  count,
  countLabel,
  defaultOpen = false,
  id,
  items = [],
  onOpenChange,
  open,
  renderSourceLink,
  resolveSourceTarget,
}: AssistantSourcesProps) => {
  const generatedId = useId();
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isControlled = open !== undefined;
  const isOpen = open ?? internalOpen;
  const resolvedCount = count ?? items.length;
  const resolvedId = id ?? `opendetail-sources-${generatedId}`;
  const resolvedLabel = getCountLabel({
    count: resolvedCount,
    countLabel,
  });

  const resolvedItems = useMemo(
    () =>
      items.map((item, index) => ({
        item,
        key: `${index}-${item.id ?? ""}-${item.url}`,
        target: resolveAssistantSourceTarget({
          resolveSourceTarget,
          source: item,
        }),
      })),
    [items, resolveSourceTarget]
  );

  if (!resolvedLabel) {
    return null;
  }

  const handleToggle = () => {
    const nextOpen = !isOpen;

    if (!isControlled) {
      setInternalOpen(nextOpen);
    }

    onOpenChange?.(nextOpen);
  };

  const linkRenderer = renderSourceLink ?? renderAssistantSourceLink;

  return (
    <div className={getClassName(className)}>
      <button
        aria-controls={resolvedId}
        aria-expanded={isOpen}
        className="opendetail-sources__toggle opendetail-meta-item"
        onClick={handleToggle}
        type="button"
      >
        <ArrowRight
          aria-hidden="true"
          className={`opendetail-meta-item__arrow ${
            isOpen ? "opendetail-meta-item__arrow--open" : ""
          }`}
          size={12}
          strokeWidth={1.2}
        />
        <span>{resolvedLabel}</span>
      </button>

      {isOpen && resolvedItems.length > 0 ? (
        <section className="opendetail-sources__pills" id={resolvedId}>
          {resolvedItems.map(({ item, key, target }) => {
            const content = (
              <>
                <SourcePillLeading item={item} target={target} />
                <span className="opendetail-sources__pill-title">
                  {item.title}
                </span>
              </>
            );

            return (
              <div className="opendetail-sources__pill-wrap" key={key}>
                {target ? (
                  linkRenderer({
                    children: content,
                    className:
                      "opendetail-sources__pill opendetail-sources__pill-link",
                    source: item,
                    target,
                    title: item.title,
                  })
                ) : (
                  <span className="opendetail-sources__pill opendetail-sources__pill--static">
                    {content}
                  </span>
                )}
              </div>
            );
          })}
        </section>
      ) : null}
    </div>
  );
};
