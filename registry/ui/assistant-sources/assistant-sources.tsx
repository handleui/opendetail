"use client";

import { AnimatePresence, motion } from "motion/react";
import { useId, useState } from "react";

export interface AssistantSourceItem {
  id?: string;
  title: string;
  url: string;
}

export interface AssistantSourcesProps {
  className?: string;
  count?: number;
  countLabel?: string;
  defaultOpen?: boolean;
  items?: AssistantSourceItem[];
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
}

const panelTransition = {
  duration: 0.18,
  ease: "easeOut",
} as const;

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

export const AssistantSources = ({
  className,
  count,
  countLabel,
  defaultOpen = false,
  items = [],
  onOpenChange,
  open,
}: AssistantSourcesProps) => {
  const panelId = useId();
  const isControlled = open !== undefined;
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const resolvedOpen = isControlled ? open : internalOpen;
  const resolvedCount = count ?? items.length;
  const resolvedLabel = getCountLabel({
    count: resolvedCount,
    countLabel,
  });
  const isInteractive = items.length > 0;

  if (!resolvedLabel) {
    return null;
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (!isControlled) {
      setInternalOpen(nextOpen);
    }

    onOpenChange?.(nextOpen);
  };

  const metaContent = (
    <>
      <span aria-hidden="true" className="opendetail-meta-item__icon" />
      <span>{resolvedLabel}</span>
    </>
  );

  return (
    <div className={getClassName(className)}>
      {isInteractive ? (
        <button
          aria-controls={panelId}
          aria-expanded={resolvedOpen}
          className="opendetail-sources__trigger opendetail-meta-item"
          data-state={resolvedOpen ? "open" : "closed"}
          onClick={() => {
            handleOpenChange(!resolvedOpen);
          }}
          type="button"
        >
          {metaContent}
        </button>
      ) : (
        <span
          className="opendetail-sources__trigger opendetail-meta-item"
          data-disabled="true"
        >
          {metaContent}
        </span>
      )}

      <AnimatePresence initial={false}>
        {resolvedOpen && isInteractive ? (
          <motion.ul
            animate={{ height: "auto", opacity: 1 }}
            className="opendetail-sources__panel"
            exit={{ height: 0, opacity: 0 }}
            id={panelId}
            initial={{ height: 0, opacity: 0 }}
            transition={panelTransition}
          >
            {items.map((item, index) => (
              <li
                className="opendetail-sources__item"
                key={item.id ?? `${item.url}-${index}`}
              >
                <a className="opendetail-sources__link" href={item.url}>
                  {item.title}
                </a>
              </li>
            ))}
          </motion.ul>
        ) : null}
      </AnimatePresence>
    </div>
  );
};
