import { Cloud, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { type AllowedTags, Streamdown } from "streamdown";

import type { AssistantSourceItem } from "../assistant-sources/assistant-sources";
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

const getRemoteFaviconUrl = (source: AssistantSourceItem): string | null => {
  try {
    const url = new URL(source.url);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }

    return `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=64`;
  } catch {
    return null;
  }
};

const CitationFallback = ({ icon: Icon }: { icon: LucideIcon }) => (
  <span aria-hidden="true" className="opendetail-citation-marker__fallback">
    <Icon size={9} strokeWidth={1.8} />
  </span>
);

const CitationMarker = ({
  citationNumber,
  source,
}: {
  citationNumber: string;
  source: AssistantSourceItem | null;
}) => {
  const isRemoteSource = source?.kind === "remote";
  const faviconUrl =
    isRemoteSource && source ? getRemoteFaviconUrl(source) : null;
  const citationTitle = getCitationTitle({
    citationNumber,
    source,
  });
  let citationContent: ReactNode = (
    <span className="opendetail-citation-marker__number">{citationNumber}</span>
  );

  if (isRemoteSource) {
    citationContent = faviconUrl ? (
      <img
        alt=""
        className="opendetail-citation-marker__favicon"
        height={12}
        loading="lazy"
        src={faviconUrl}
        width={12}
      />
    ) : (
      <CitationFallback icon={Cloud} />
    );
  }

  return (
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
};

const replaceCitationMarkers = (markdown: string): string =>
  markdown.replace(CITATION_REGEX, (_match, citationNumber: string) => {
    return `<${CITATION_TAG} ref="${citationNumber}"></${CITATION_TAG}>`;
  });

const getTextBlock = ({
  className,
  content,
  sources,
}: {
  className: string;
  content: ReactNode;
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
  defaultSourcesOpen: _defaultSourcesOpen = false,
  error = null,
  image = null,
  lead,
  meta: _meta = null,
  status = "complete",
  sources = [],
}: AssistantResponseProps) => {
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
        sources,
      })}

      {hasImage ? (
        <div className="opendetail-response__image">
          {image?.src ? (
            <img
              alt={image.alt ?? ""}
              height={IMAGE_HEIGHT}
              loading="lazy"
              src={image.src}
              width={IMAGE_WIDTH}
            />
          ) : null}
        </div>
      ) : null}

      {getTextBlock({
        className: "opendetail-response-markdown",
        content: children,
        sources,
      })}

      {/*
      <footer className="opendetail-response__footer">
        <AssistantSources
          count={sourceCount}
          countLabel={sourceLabel}
          defaultOpen={defaultSourcesOpen}
          items={sources}
        />
      </footer>
      */}
    </article>
  );
};
