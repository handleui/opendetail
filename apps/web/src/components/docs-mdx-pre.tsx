import {
  Children,
  type ComponentProps,
  isValidElement,
  type ReactNode,
} from "react";

import {
  collectText,
  HighlightedCodeBlock,
  LANGUAGE_CODE_CLASS,
  TRAILING_NEWLINE,
} from "@/components/code-block";

/**
 * Fenced code blocks from Markdown still render the highlighted shell (same as {@link CodeBlock}).
 */
export function DocsMdxPre(props: ComponentProps<"pre">) {
  const { children, ...rest } = props;
  const extracted = extractFence(children);

  if (!extracted) {
    return (
      <pre
        className="my-6 overflow-x-auto rounded-xl border border-solid bg-neutral-50 p-4 text-[13px] text-neutral-900 leading-relaxed [&>code]:rounded-none [&>code]:bg-transparent [&>code]:p-0"
        style={{ borderColor: "var(--opendetail-color-sidebar-stroke)" }}
        {...rest}
      >
        {children}
      </pre>
    );
  }

  const { code, lang } = extracted;
  return <HighlightedCodeBlock code={code} lang={lang} />;
}

function extractFence(
  children: ReactNode
): { code: string; lang: string } | null {
  const parts = Children.toArray(children).filter(
    (c) => !(typeof c === "string" && c.trim() === "")
  );
  if (parts.length !== 1) {
    return null;
  }
  const only = parts[0];
  if (!isValidElement<{ className?: string; children?: ReactNode }>(only)) {
    return null;
  }
  const className = only.props.className;
  if (typeof className !== "string" || !className.includes("language-")) {
    return null;
  }
  const langMatch = LANGUAGE_CODE_CLASS.exec(className);
  const lang = langMatch?.[1] ?? "text";
  const code = collectText(only.props.children).replace(TRAILING_NEWLINE, "");
  if (!code) {
    return null;
  }
  return { code, lang };
}
