import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getDocsMdxComponents } from "@/components/docs-mdx-components";
import { DocsPageHeader } from "@/components/docs-page-header";
import { gitConfig } from "@/lib/shared";
import { getPageImage, getPageMarkdownUrl, source } from "@/lib/source";

export default function Page() {
  const page = source.getPage(["components"]);
  if (!page) {
    notFound();
  }

  const MDX = page.data.body;
  const markdownUrl = getPageMarkdownUrl(page).url;
  const githubUrl = `https://github.com/${gitConfig.user}/${gitConfig.repo}/blob/${gitConfig.branch}/content/docs/${page.path}`;

  return (
    <article className="docs-article mx-auto w-full max-w-[650px] pb-16">
      <DocsPageHeader title={page.data.title} />
      <MDX components={getDocsMdxComponents(source, page)} />
      <div className="mt-14 flex flex-wrap gap-x-4 gap-y-2 border-[var(--opendetail-color-sidebar-stroke)] border-t border-solid pt-8 text-[14px] text-neutral-500">
        <Link
          className="text-neutral-600 underline-offset-4 transition-colors hover:text-neutral-950 hover:underline"
          href={markdownUrl}
        >
          Markdown
        </Link>
        <a
          className="text-neutral-600 underline-offset-4 transition-colors hover:text-neutral-950 hover:underline"
          href={githubUrl}
          rel="noopener noreferrer"
          target="_blank"
        >
          View on GitHub
        </a>
      </div>
    </article>
  );
}

export function generateMetadata(): Metadata {
  const page = source.getPage(["components"]);
  if (!page) {
    notFound();
  }

  const canonicalPath = "/components";

  return {
    title: page.data.title,
    description: page.data.description,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      url: canonicalPath,
      images: getPageImage(page).url,
    },
  };
}
