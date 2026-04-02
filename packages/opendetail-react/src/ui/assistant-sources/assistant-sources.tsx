"use client";

import { ArrowRight } from "lucide-react";
import { useId, useMemo, useState } from "react";
import {
  type AssistantSourceItem,
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

const getItemLabel = ({
  index,
  item,
}: {
  index: number;
  item: AssistantSourceItem;
}): string => item.id ?? String(index + 1);

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
        label: getItemLabel({ index, item }),
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
        <ol className="opendetail-sources__list" id={resolvedId}>
          {resolvedItems.map(({ item, label, target }) => {
            const content = (
              <>
                <span
                  aria-hidden="true"
                  className="opendetail-sources__item-number"
                >
                  [{label}]
                </span>
                <span className="opendetail-sources__item-title">
                  {item.title}
                </span>
              </>
            );

            return (
              <li
                className="opendetail-sources__item"
                key={`${label}-${item.url}`}
              >
                {target ? (
                  linkRenderer({
                    children: content,
                    className: "opendetail-sources__link",
                    source: item,
                    target,
                    title: item.title,
                  })
                ) : (
                  <span className="opendetail-sources__text">{content}</span>
                )}
              </li>
            );
          })}
        </ol>
      ) : null}
    </div>
  );
};
