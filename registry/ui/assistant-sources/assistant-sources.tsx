import { ArrowRight } from "lucide-react";

export interface AssistantSourceItem {
  id?: string;
  kind?: "local" | "remote";
  title: string;
  url: string;
}

export interface AssistantSourcesProps {
  className?: string;
  count?: number;
  countLabel?: string;
  defaultOpen?: boolean;
  id?: string;
  items?: AssistantSourceItem[];
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
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

export const AssistantSources = ({
  className,
  count,
  countLabel,
  defaultOpen: _defaultOpen = false,
  id: _id,
  items = [],
  onOpenChange: _onOpenChange,
  open: _open,
}: AssistantSourcesProps) => {
  const resolvedCount = count ?? items.length;
  const resolvedLabel = getCountLabel({
    count: resolvedCount,
    countLabel,
  });

  if (!resolvedLabel) {
    return null;
  }

  return (
    <span className={`${getClassName(className)} opendetail-meta-item`}>
      <ArrowRight
        aria-hidden="true"
        className="opendetail-meta-item__arrow"
        size={12}
        strokeWidth={1.2}
      />
      <span>{resolvedLabel}</span>
    </span>
  );
};
