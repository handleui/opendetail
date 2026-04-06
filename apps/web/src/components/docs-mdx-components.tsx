import type { InferPageType } from "fumadocs-core/source";
import { createRelativeLink } from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

import { CodeBlock } from "@/components/code-block";
import { CopyCommand } from "@/components/copy-command";
import { DocsMdxPre } from "@/components/docs-mdx-pre";
import type { source } from "@/lib/source";
import type { uiSource } from "@/lib/ui-source";

type DocsPage = InferPageType<typeof source>;
type UiDocsPage = InferPageType<typeof uiSource>;

function Cards({ children }: { children?: ReactNode }) {
  return (
    <div className="my-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {children}
    </div>
  );
}

function Card({
  title,
  description,
  href,
  children,
}: {
  title?: string;
  description?: string;
  href?: string;
  children?: ReactNode;
}) {
  const inner = (
    <>
      {title ? (
        <h3 className="mb-1 font-medium text-[14px] text-neutral-950">
          {title}
        </h3>
      ) : null}
      {description ? (
        <p className="my-0 text-[14px] text-neutral-600">{description}</p>
      ) : null}
      {children ? (
        <div className="text-[14px] text-neutral-600">{children}</div>
      ) : null}
    </>
  );

  const className =
    "block rounded-xl border border-solid bg-white p-4 text-left transition-colors hover:border-neutral-400/70";

  const style = {
    borderColor: "var(--opendetail-color-sidebar-stroke)",
  };

  if (href) {
    return (
      <Link className={className} href={href} style={style}>
        {inner}
      </Link>
    );
  }

  return (
    <div className={className} style={style}>
      {inner}
    </div>
  );
}

export function getDocsMdxComponents(
  pageSource: typeof source,
  page: DocsPage
): MDXComponents;
export function getDocsMdxComponents(
  pageSource: typeof uiSource,
  page: UiDocsPage
): MDXComponents;
export function getDocsMdxComponents(
  pageSource: typeof source | typeof uiSource,
  page: DocsPage | UiDocsPage
): MDXComponents {
  const A = createRelativeLink(
    pageSource,
    page,
    Link as Parameters<typeof createRelativeLink>[2]
  );

  return {
    a: A,
    Card,
    Cards,
    CodeBlock,
    CopyCommand,
    h1: (props: ComponentProps<"h1">) => (
      <h1
        className="mt-10 mb-4 font-medium text-[28px] text-black tracking-tight first:mt-0"
        {...props}
      />
    ),
    h2: (props: ComponentProps<"h2">) => (
      <h2
        className="mt-10 mb-3 font-medium text-neutral-950 text-xl tracking-tight"
        {...props}
      />
    ),
    h3: (props: ComponentProps<"h3">) => (
      <h3
        className="mt-8 mb-2 font-medium text-lg text-neutral-950"
        {...props}
      />
    ),
    h4: (props: ComponentProps<"h4">) => (
      <h4
        className="mt-6 mb-2 font-medium text-base text-neutral-950"
        {...props}
      />
    ),
    h5: (props: ComponentProps<"h5">) => (
      <h5
        className="mt-4 mb-2 font-medium text-[14px] text-neutral-950"
        {...props}
      />
    ),
    h6: (props: ComponentProps<"h6">) => (
      <h6
        className="mt-4 mb-2 font-medium text-[14px] text-neutral-950"
        {...props}
      />
    ),
    p: (props: ComponentProps<"p">) => (
      <p
        className="my-4 text-[14px] text-neutral-900 leading-relaxed"
        {...props}
      />
    ),
    ul: (props: ComponentProps<"ul">) => (
      <ul
        className="my-4 list-disc space-y-2 ps-5 text-[14px] text-neutral-900 leading-relaxed"
        {...props}
      />
    ),
    ol: (props: ComponentProps<"ol">) => (
      <ol
        className="my-4 list-decimal space-y-2 ps-5 text-[14px] text-neutral-900 leading-relaxed"
        {...props}
      />
    ),
    li: (props: ComponentProps<"li">) => <li {...props} />,
    blockquote: (props: ComponentProps<"blockquote">) => (
      <blockquote
        className="my-4 border-neutral-300 border-s-2 ps-4 text-neutral-700 italic"
        {...props}
      />
    ),
    hr: (props: ComponentProps<"hr">) => (
      <hr
        className="my-10 border-[var(--opendetail-color-sidebar-stroke)] border-t border-solid"
        {...props}
      />
    ),
    pre: DocsMdxPre,
    code: ({ className, children, ...props }: ComponentProps<"code">) => {
      const isBlock =
        typeof className === "string" && className.includes("language-");
      if (isBlock) {
        return (
          <code className={className} {...props}>
            {children}
          </code>
        );
      }
      return (
        <code
          className="rounded-md bg-neutral-100 px-1.5 py-0.5 font-mono font-normal text-[13px] text-neutral-900"
          {...props}
        >
          {children}
        </code>
      );
    },
    table: (props: ComponentProps<"table">) => (
      <div className="my-6 overflow-x-auto">
        <table
          className="w-full border-collapse text-[14px] text-neutral-900"
          {...props}
        />
      </div>
    ),
    th: (props: ComponentProps<"th">) => (
      <th
        className="border border-neutral-200 bg-neutral-50 px-3 py-2 text-start font-medium"
        {...props}
      />
    ),
    td: (props: ComponentProps<"td">) => (
      <td className="border border-neutral-200 px-3 py-2" {...props} />
    ),
    img: (props: ComponentProps<"img">) => (
      // biome-ignore lint/performance/noImgElement: MDX embeds arbitrary doc asset URLs
      // biome-ignore lint/correctness/useImageSize: dimensions come from MDX authors
      <img
        alt={props.alt ?? ""}
        className="my-6 h-auto max-w-full rounded-lg"
        {...props}
      />
    ),
  } as MDXComponents;
}
