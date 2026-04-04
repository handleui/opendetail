import { Globe, type LucideIcon } from "lucide-react";
import { type ReactNode, useMemo } from "react";
import { type AllowedTags, Streamdown } from "streamdown";

import { AssistantSources } from "../assistant-sources/assistant-sources";
import type { AssistantSourceItem } from "../assistant-sources/source-links";
import {
  type RenderAssistantSourceLink,
  type ResolveAssistantSourceTarget,
  renderAssistantSourceLink,
  resolveAssistantSourceTarget,
} from "../assistant-sources/source-links";
import { AssistantStatus } from "../assistant-status/assistant-status";

const IMAGE_WIDTH = 549;
const IMAGE_HEIGHT = 254;
const CITATION_REGEX = /\[(\d+)\]/gu;
const CITATION_TAG = "citation";
const ALLOWED_MARKDOWN_TAGS: AllowedTags = {
  [CITATION_TAG]: ["ref"],
};

export interface AssistantResponseImage {
  alt?: string;
  placeholder?: boolean;
  src?: string;
}

export interface AssistantResponseMeta {
  durationLabel?: string;
  /**
   * @deprecated Ignored for the sources footer. Source pills are derived from
   * `[n]` citations in the response markdown (`lead` / `children`), not from this field.
   */
  sourceCount?: number;
  sourceLabel?: string;
}

export interface AssistantResponseProps {
  children?: ReactNode;
  className?: string;
  defaultSourcesOpen?: boolean;
  error?: string | null;
  image?: AssistantResponseImage | null;
  lead?: ReactNode;
  meta?: AssistantResponseMeta | null;
  renderSourceLink?: RenderAssistantSourceLink;
  resolveSourceTarget?: ResolveAssistantSourceTarget;
  sources?: AssistantSourceItem[];
  status?: "complete" | "error" | "pending" | "streaming";
}

const getClassName = (className?: string): string =>
  ["opendetail-response", className].filter(Boolean).join(" ");

const getSourceForCitation = ({
  citationNumber,
  sources,
}: {
  citationNumber: string;
  sources: AssistantSourceItem[];
}): AssistantSourceItem | null => {
  const matchedSource =
    sources.find((source) => source.id === citationNumber) ??
    sources[Number(citationNumber) - 1];

  return matchedSource ?? null;
};

/**
 * Returns sources that appear as `[n]` citations in string `lead` / `children`, in first-seen order.
 * Non-string React nodes are not scanned.
 */
export const getSourcesCitedInContent = ({
  children,
  lead,
  sources,
}: {
  children?: ReactNode;
  lead?: ReactNode;
  sources: AssistantSourceItem[];
}): AssistantSourceItem[] => {
  const segments: string[] = [];

  if (typeof lead === "string") {
    segments.push(lead);
  }

  if (typeof children === "string") {
    segments.push(children);
  }

  const combined = segments.join("\n");
  const seen = new Set<string>();
  const ordered: AssistantSourceItem[] = [];

  for (const match of combined.matchAll(CITATION_REGEX)) {
    const citationNumber = match[1] ?? "";

    if (citationNumber.length === 0 || seen.has(citationNumber)) {
      continue;
    }

    seen.add(citationNumber);
    const source = getSourceForCitation({
      citationNumber,
      sources,
    });

    if (source) {
      ordered.push(source);
    }
  }

  return ordered;
};

const getCitationTitle = ({
  citationNumber,
  source,
}: {
  citationNumber: string;
  source: AssistantSourceItem | null;
}): string =>
  source?.title.trim().length
    ? `Citation ${citationNumber}: ${source.title}`
    : `Citation ${citationNumber}`;

const CitationFallback = ({ icon: Icon }: { icon: LucideIcon }) => (
  <span aria-hidden="true" className="opendetail-citation-marker__fallback">
    <Icon size={9} strokeWidth={1.8} />
  </span>
);

const CitationMarker = ({
  citationNumber,
  renderSourceLink,
  resolveSourceTarget,
  source,
}: {
  citationNumber: string;
  renderSourceLink?: RenderAssistantSourceLink;
  resolveSourceTarget?: ResolveAssistantSourceTarget;
  source: AssistantSourceItem | null;
}) => {
  const isRemoteSource = source?.kind === "remote";
  const citationTitle = getCitationTitle({
    citationNumber,
    source,
  });
  let citationContent: ReactNode = (
    <span className="opendetail-citation-marker__number">{citationNumber}</span>
  );

  if (isRemoteSource) {
    citationContent = <CitationFallback icon={Globe} />;
  }

  const marker = (
    <span
      aria-label={citationTitle}
      className={`opendetail-citation-marker ${
        isRemoteSource
          ? "opendetail-citation-marker--remote"
          : "opendetail-citation-marker--local"
      }`}
      role="img"
      title={citationTitle}
    >
      {citationContent}
    </span>
  );

  if (!source) {
    return marker;
  }

  const target = resolveAssistantSourceTarget({
    resolveSourceTarget,
    source,
  });

  if (!target) {
    return marker;
  }

  const linkRenderer = renderSourceLink ?? renderAssistantSourceLink;

  return linkRenderer({
    children: marker,
    className: "opendetail-citation-link",
    source,
    target,
    title: citationTitle,
  });
};

const replaceCitationMarkers = (markdown: string): string =>
  markdown.replace(CITATION_REGEX, (_match, citationNumber: string) => {
    return `<${CITATION_TAG} ref="${citationNumber}"></${CITATION_TAG}>`;
  });

const getTextBlock = ({
  className,
  content,
  renderSourceLink,
  resolveSourceTarget,
  sources,
}: {
  className: string;
  content: ReactNode;
  renderSourceLink?: RenderAssistantSourceLink;
  resolveSourceTarget?: ResolveAssistantSourceTarget;
  sources: AssistantSourceItem[];
}) => {
  if (content === null || content === undefined || content === false) {
    return null;
  }

  if (typeof content === "number") {
    return <p className={className}>{content}</p>;
  }

  if (typeof content === "string") {
    return (
      <Streamdown
        allowedTags={ALLOWED_MARKDOWN_TAGS}
        className={className}
        components={{
          citation: (props) => {
            const citationNumber =
              (typeof props.ref === "string" ? props.ref : null) ??
              (typeof props.node?.properties?.ref === "string"
                ? props.node.properties.ref
                : null);

            if (!citationNumber) {
              return null;
            }

            return (
              <CitationMarker
                citationNumber={citationNumber}
                renderSourceLink={renderSourceLink}
                resolveSourceTarget={resolveSourceTarget}
                source={getSourceForCitation({
                  citationNumber,
                  sources,
                })}
              />
            );
          },
        }}
      >
        {replaceCitationMarkers(content)}
      </Streamdown>
    );
  }

  return <div className={className}>{content}</div>;
};

export const AssistantResponse = ({
  children,
  className,
  defaultSourcesOpen = false,
  error = null,
  image = null,
  lead,
  meta = null,
  renderSourceLink,
  resolveSourceTarget,
  status = "complete",
  sources = [],
}: AssistantResponseProps) => {
  const sourceLabel = meta?.sourceLabel;
  const citedSources = useMemo(
    () => getSourcesCitedInContent({ children, lead, sources }),
    [children, lead, sources]
  );
  const fallbackError =
    error ??
    (typeof lead === "string" && lead.length > 0 ? lead : null) ??
    (typeof children === "string" && children.length > 0 ? children : null) ??
    "OpenDetail request failed.";

  if (status === "pending") {
    return (
      <article className={getClassName(className)}>
        <AssistantStatus variant="thinking" />
      </article>
    );
  }

  if (status === "error") {
    return (
      <article className={getClassName(className)}>
        <AssistantStatus label={fallbackError} variant="error" />
      </article>
    );
  }
  const hasImage = image?.placeholder || image?.src;

  return (
    <article className={getClassName(className)}>
      {getTextBlock({
        className: "opendetail-response__lead",
        content: lead,
        renderSourceLink,
        resolveSourceTarget,
        sources,
      })}

      {hasImage ? (
        <div className="opendetail-response__image">
          {image?.src ? (
            <img
              alt={image.alt ?? ""}
              decoding="async"
              height={IMAGE_HEIGHT}
              loading="lazy"
              referrerPolicy="no-referrer"
              src={image.src}
              width={IMAGE_WIDTH}
            />
          ) : null}
        </div>
      ) : null}

      {getTextBlock({
        className: "opendetail-response-markdown",
        content: children,
        renderSourceLink,
        resolveSourceTarget,
        sources,
      })}

      {citedSources.length > 0 ? (
        <footer className="opendetail-response__footer">
          <AssistantSources
            count={citedSources.length}
            countLabel={sourceLabel}
            defaultOpen={defaultSourcesOpen}
            items={citedSources}
            renderSourceLink={renderSourceLink}
            resolveSourceTarget={resolveSourceTarget}
          />
        </footer>
      ) : null}
    </article>
  );
};
