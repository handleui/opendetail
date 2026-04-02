import Link from "next/link";
import type { ReactNode } from "react";

export const DocsPageScaffold = ({
  children,
  description,
  githubUrl,
  hasToc,
  markdownUrl,
  title,
}: {
  children: ReactNode;
  description?: string;
  githubUrl: string;
  hasToc: boolean;
  markdownUrl: string;
  title: string;
}) => {
  return (
    <article className="mx-auto w-full max-w-4xl px-4 py-6" data-docs-page>
      <header data-docs-page-header>
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
        <p>
          <Link href={markdownUrl}>Markdown</Link>
          {" · "}
          <Link href={githubUrl}>GitHub</Link>
        </p>
        {hasToc ? <div data-docs-toc-scaffold="" /> : null}
      </header>

      <div data-docs-content>{children}</div>
    </article>
  );
};
