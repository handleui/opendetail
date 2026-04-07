import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDocsMdxComponents } from "@/components/docs-mdx-components";
import { DocsPageChrome } from "@/components/docs-page-chrome";
import { gitConfig } from "@/lib/shared";
import { getPageImage, getPageMarkdownUrl, source } from "@/lib/source";

export default async function Page(props: PageProps<"/docs/[[...slug]]">) {
  const params = await props.params;
  const page = source.getPage(params.slug);
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
      >
        <MDX components={getDocsMdxComponents(source, page)} />
      </DocsPageChrome>
    </article>
  );
}

export function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata(
  props: PageProps<"/docs/[[...slug]]">
): Promise<Metadata> {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) {
    notFound();
  }

  return {
    title: page.data.title,
    description: page.data.description,
    openGraph: {
      images: getPageImage(page).url,
    },
  };
}
