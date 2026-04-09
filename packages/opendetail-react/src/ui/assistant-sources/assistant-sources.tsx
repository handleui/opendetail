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

const SourcePillLeading = ({
  item,
}: {
  item: AssistantSourceItem;
  target: AssistantSourceTarget | null;
}) => {
  if (item.kind === "remote") {
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
