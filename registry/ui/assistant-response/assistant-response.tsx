import { Fragment, type ReactNode } from "react";

import {
  type AssistantSourceItem,
  AssistantSources,
} from "../assistant-sources/assistant-sources";

const IMAGE_WIDTH = 549;
const IMAGE_HEIGHT = 254;
const CITATION_REGEX = /\[(\d+)\]/gu;

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
  image?: AssistantResponseImage | null;
  lead?: ReactNode;
  meta?: AssistantResponseMeta | null;
  sources?: AssistantSourceItem[];
}

const getClassName = (className?: string): string =>
  ["opendetail-response", className].filter(Boolean).join(" ");

const renderInlineCitationMarkers = (text: string): ReactNode => {
  const matches = [...text.matchAll(CITATION_REGEX)];

  if (matches.length === 0) {
    return text;
  }

  const nodes: ReactNode[] = [];
  let lastIndex = 0;

  for (const match of matches) {
    const matchedText = match[0];
    const citationNumber = match[1];
    const matchIndex = match.index ?? 0;

    if (matchIndex > lastIndex) {
      nodes.push(
        <Fragment key={`text-${lastIndex}`}>
          {text.slice(lastIndex, matchIndex)}
        </Fragment>
      );
    }

    nodes.push(
      <span
        aria-label={`Citation ${citationNumber}`}
        className="opendetail-citation-marker"
        key={`citation-${matchIndex}-${matchedText}`}
        role="img"
        title={`Citation ${citationNumber}`}
      />
    );

    lastIndex = matchIndex + matchedText.length;
  }

  if (lastIndex < text.length) {
    nodes.push(
      <Fragment key={`text-${lastIndex}`}>{text.slice(lastIndex)}</Fragment>
    );
  }

  return nodes;
};

const getTextBlock = ({
  className,
  content,
}: {
  className: string;
  content: ReactNode;
}) => {
  if (content === null || content === undefined || content === false) {
    return null;
  }

  if (typeof content === "number") {
    return <p className={className}>{content}</p>;
  }

  if (typeof content === "string") {
    return <p className={className}>{renderInlineCitationMarkers(content)}</p>;
  }

  return <div className={className}>{content}</div>;
};

const getSourceLabel = ({
  meta,
  sources,
}: {
  meta?: AssistantResponseMeta | null;
  sources: AssistantSourceItem[];
}): string | undefined => {
  if (meta?.sourceLabel) {
    return meta.sourceLabel;
  }

  const count = meta?.sourceCount ?? sources.length;

  if (count <= 0) {
    return undefined;
  }

  return `${count} source${count === 1 ? "" : "s"}`;
};

export const AssistantResponse = ({
  children,
  className,
  defaultSourcesOpen = false,
  image = null,
  lead,
  meta = null,
  sources = [],
}: AssistantResponseProps) => {
  const sourceCount = meta?.sourceCount ?? sources.length;
  const sourceLabel = getSourceLabel({
    meta,
    sources,
  });
  const hasImage = image?.placeholder || image?.src;
  const hasMeta = sourceCount > 0 || Boolean(meta?.durationLabel);

  return (
    <article className={getClassName(className)}>
      {getTextBlock({
        className: "opendetail-response__lead",
        content: lead,
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
      })}

      {hasMeta ? (
        <footer className="opendetail-response__footer">
          <AssistantSources
            count={sourceCount}
            countLabel={sourceLabel}
            defaultOpen={defaultSourcesOpen}
            items={sources}
          />

          {meta?.durationLabel ? (
            <span className="opendetail-meta-item">
              <span aria-hidden="true" className="opendetail-meta-item__icon" />
              <span>{meta.durationLabel}</span>
            </span>
          ) : null}
        </footer>
      ) : null}
    </article>
  );
};
