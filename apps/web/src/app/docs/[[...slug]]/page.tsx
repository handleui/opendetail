import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DocsLandingHeader } from "@/components/docs-landing-header";
import { DocsPageHeader } from "@/components/docs-page-header";
import { getDocsMdxComponents } from "@/components/docs-mdx-components";
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

  const isDocsIndex = page.slugs.length === 0;

  return (
    <article className="docs-article pb-16">
      {isDocsIndex ? (
        <DocsLandingHeader />
      ) : (
        <DocsPageHeader title={page.data.title} />
      )}
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
