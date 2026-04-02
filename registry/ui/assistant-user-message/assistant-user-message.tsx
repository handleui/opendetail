"use client";

import { prepareWithSegments, walkLineRanges } from "@chenglou/pretext";
import { type ReactNode, useEffect, useRef } from "react";

const getClassName = (className?: string): string =>
  ["opendetail-user-message", className].filter(Boolean).join(" ");

const MIN_BUBBLE_TEXT_WIDTH = 1;

const getFontDefinition = (style: CSSStyleDeclaration): string => {
  if (style.font.trim().length > 0) {
    return style.font;
  }

  return [style.fontStyle, style.fontWeight, style.fontSize, style.fontFamily]
    .filter((value) => value.trim().length > 0 && value !== "normal")
    .join(" ");
};

const getPixelValue = (value: string): number | null => {
  const parsedValue = Number.parseFloat(value);

  return Number.isFinite(parsedValue) ? parsedValue : null;
};

const getLineCount = ({
  maxWidth,
  prepared,
}: {
  maxWidth: number;
  prepared: ReturnType<typeof prepareWithSegments>;
}): number => {
  let lineCount = 0;

  walkLineRanges(prepared, maxWidth, () => {
    lineCount += 1;
  });

  return Math.max(lineCount, 1);
};

const getBalancedTextWidth = ({
  maxWidth,
  prepared,
}: {
  maxWidth: number;
  prepared: ReturnType<typeof prepareWithSegments>;
}): number => {
  const targetLineCount = getLineCount({
    maxWidth,
    prepared,
  });

  let low = MIN_BUBBLE_TEXT_WIDTH;
  let high = Math.max(MIN_BUBBLE_TEXT_WIDTH, Math.ceil(maxWidth));

  while (low < high) {
    const candidateWidth = Math.floor((low + high) / 2);
    const candidateLineCount = getLineCount({
      maxWidth: candidateWidth,
      prepared,
    });

    if (candidateLineCount <= targetLineCount) {
      high = candidateWidth;
    } else {
      low = candidateWidth + 1;
    }
  }

  return low;
};

export interface AssistantUserMessageProps {
  children?: ReactNode;
  className?: string;
  initial?: string;
}

export const AssistantUserMessage = ({
  children,
  className,
  initial: _initial = "R",
}: AssistantUserMessageProps) => {
  const contentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const contentElement = contentRef.current;

    if (typeof children !== "string") {
      contentElement?.style.removeProperty("width");
      return undefined;
    }

    if (!contentElement) {
      return undefined;
    }

    const articleElement = contentElement.parentElement;

    if (!articleElement) {
      return undefined;
    }

    let isCancelled = false;

    const applyBalancedWidth = () => {
      if (isCancelled) {
        return;
      }

      const articleWidth = articleElement.getBoundingClientRect().width;
      const style = window.getComputedStyle(contentElement);
      const maxWidth = getPixelValue(style.maxWidth) ?? articleWidth;
      const availableBubbleWidth = Math.min(articleWidth, maxWidth);
      const horizontalPadding =
        (getPixelValue(style.paddingLeft) ?? 0) +
        (getPixelValue(style.paddingRight) ?? 0);
      const maxTextWidth = Math.max(
        MIN_BUBBLE_TEXT_WIDTH,
        availableBubbleWidth - horizontalPadding
      );
      const prepared = prepareWithSegments(children, getFontDefinition(style));
      const balancedTextWidth = getBalancedTextWidth({
        maxWidth: maxTextWidth,
        prepared,
      });
      let widestLineWidth = 0;

      walkLineRanges(prepared, balancedTextWidth, (line) => {
        widestLineWidth = Math.max(widestLineWidth, line.width);
      });

      const balancedBubbleWidth = Math.min(
        availableBubbleWidth,
        Math.ceil(
          Math.max(balancedTextWidth, widestLineWidth) + horizontalPadding
        )
      );
      const lineCount = getLineCount({
        maxWidth: balancedTextWidth,
        prepared,
      });

      if (lineCount <= 1) {
        contentElement.style.removeProperty("width");
        return;
      }

      contentElement.style.width = `${balancedBubbleWidth}px`;
    };

    const resizeObserver = new ResizeObserver(() => {
      applyBalancedWidth();
    });
    const fontSet = document.fonts;

    resizeObserver.observe(articleElement);
    applyBalancedWidth();

    fontSet?.addEventListener("loadingdone", applyBalancedWidth);

    return () => {
      isCancelled = true;
      fontSet?.removeEventListener("loadingdone", applyBalancedWidth);
      resizeObserver.disconnect();
    };
  }, [children]);

  return (
    <article className={getClassName(className)}>
      {/*
      <span aria-hidden="true" className="opendetail-user-message__badge">
        {_initial}
      </span>
      */}
      <div className="opendetail-user-message__content" ref={contentRef}>
        {children}
      </div>
    </article>
  );
};
