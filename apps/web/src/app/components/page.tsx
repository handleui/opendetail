import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDocsMdxComponents } from "@/components/docs-mdx-components";
import { DocsPageChrome } from "@/components/docs-page-chrome";
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
  const toc = page.data.toc ?? [];

  return (
    <article className="docs-article pb-16">
      <DocsPageChrome
        feedbackPath={page.url}
        githubUrl={githubUrl}
        markdownUrl={markdownUrl}
        pageTitle={page.data.title}
        toc={toc}
        variant="components"
      >
        <MDX components={getDocsMdxComponents(source, page)} />
      </DocsPageChrome>
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
