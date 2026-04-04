import {
  cache,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import { codeToHtml } from "shiki";

import { DocsCodeCopyButton } from "@/components/docs-code-copy-button";

export const LANGUAGE_CODE_CLASS = /language-([^\s]+)/;
export const TRAILING_NEWLINE = /\n$/;

/** Maps common fence ids to Shiki bundled language ids. */
const LANG_ALIASES: Record<string, string> = {
  cjs: "javascript",
  js: "javascript",
  mjs: "javascript",
  sh: "bash",
  shell: "bash",
  zsh: "bash",
  ts: "typescript",
  yml: "yaml",
  rs: "rust",
  txt: "plaintext",
};

const LANG_LABELS: Record<string, string> = {
  bash: "Shell",
  css: "CSS",
  html: "HTML",
  javascript: "JavaScript",
  json: "JSON",
  markdown: "Markdown",
  mdx: "MDX",
  plaintext: "Text",
  text: "Text",
  toml: "TOML",
  tsx: "TSX",
  typescript: "TypeScript",
  yaml: "YAML",
};

const highlightCode = cache(async (code: string, lang: string) => {
  const normalized = LANG_ALIASES[lang.toLowerCase()] ?? lang.toLowerCase();
  try {
    return await codeToHtml(code, {
      lang: normalized,
      theme: "github-light",
    });
  } catch {
    return await codeToHtml(code, {
      lang: "plaintext",
      theme: "github-light",
    });
  }
});

export function collectText(node: ReactNode): string {
  if (node == null || typeof node === "boolean") {
    return "";
  }
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(collectText).join("");
  }
  if (isValidElement(node)) {
    return collectText(
      (node as ReactElement<{ children?: ReactNode }>).props.children
    );
  }
  return "";
}

function languageLabel(lang: string): string {
  const key = LANG_ALIASES[lang.toLowerCase()] ?? lang.toLowerCase();
  return LANG_LABELS[key] ?? lang;
}

export interface CodeBlockProps {
  children?: ReactNode;
  /** Prefer passing multiline source here when the snippet contains `` ` `` or `${` (avoid MDX template interpolation). */
  code?: string;
  /** Fence language id (e.g. `toml`, `ts`, `bash`). */
  lang: string;
}

/**
 * Docs code block — Shiki highlighting, copy control, chrome aligned with {@link CopyCommand}.
 * Use from MDX as `<CodeBlock lang="toml">{`…`}</CodeBlock>` or with a `code` prop.
 */
export function CodeBlock({ lang, code, children }: CodeBlockProps) {
  const raw = (typeof code === "string" ? code : collectText(children)).replace(
    TRAILING_NEWLINE,
    ""
  );
  if (!raw) {
    return null;
  }
  return <HighlightedCodeBlock code={raw} lang={lang} />;
}

/** Shared highlighted shell for fenced `pre` and explicit {@link CodeBlock}. */
export async function HighlightedCodeBlock({
  code,
  lang,
}: {
  code: string;
  lang: string;
}) {
  const html = await highlightCode(code, lang);
  const label = languageLabel(lang);

  return (
    <div
      className="my-4 overflow-hidden rounded-lg border border-solid bg-white"
      data-code-block=""
      style={{ borderColor: "var(--opendetail-color-sidebar-stroke)" }}
    >
      <div className="flex min-h-11 min-w-0 items-center justify-between gap-3 border-[var(--opendetail-color-sidebar-stroke)] border-b border-solid px-4 py-2">
        <span className="truncate font-normal text-[13px] text-neutral-950">
          {label}
        </span>
        <DocsCodeCopyButton text={code} />
      </div>
      <div
        className="overflow-x-auto px-4 py-3 [&_code]:font-mono [&_code]:text-[13px] [&_pre.shiki]:m-0 [&_pre.shiki]:bg-transparent [&_pre.shiki]:p-0 [&_pre.shiki]:font-mono [&_pre.shiki]:text-[13px] [&_pre.shiki]:leading-relaxed"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: Shiki output is generated server-side from trusted MDX
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
