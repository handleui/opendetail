import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { InputDemo } from "@/components/component-demos/input-demo";
import { ShellDemo } from "@/components/component-demos/shell-demo";
import { SuggestionsDemo } from "@/components/component-demos/suggestions-demo";
import { ComponentPreviewSurface } from "@/components/component-preview-surface";
import { getDocsMdxComponents } from "@/components/docs-mdx-components";
import { DocsPageChrome } from "@/components/docs-page-chrome";
import { knownSourcePageUrls } from "@/lib/known-source-page-urls";
import { gitConfig } from "@/lib/shared";
import { getPageImage, getPageMarkdownUrl, source } from "@/lib/source";

const COMPONENT_SLUGS = ["shell", "input", "recommendations"] as const;

type ComponentSlug = (typeof COMPONENT_SLUGS)[number];

function isComponentSlug(value: string): value is ComponentSlug {
  return (COMPONENT_SLUGS as readonly string[]).includes(value);
}

function ComponentPreview({
  slug,
}: {
  slug: ComponentSlug;
}) {
  switch (slug) {
    case "input":
      return <InputDemo />;
    case "recommendations":
      return <SuggestionsDemo />;
    case "shell":
      return <ShellDemo knownSourcePageUrls={knownSourcePageUrls} />;
    default:
      return null;
  }
}

export default async function Page(props: PageProps<"/components/[slug]">) {
  const params = await props.params;
  if (!isComponentSlug(params.slug)) {
    notFound();
  }

  const page = source.getPage(["components", params.slug]);
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
        preview={
          <ComponentPreviewSurface>
            <ComponentPreview slug={params.slug} />
          </ComponentPreviewSurface>
        }
        toc={toc}
        variant="components"
      >
        <MDX components={getDocsMdxComponents(source, page)} />
      </DocsPageChrome>
    </article>
  );
}

export function generateStaticParams() {
  return COMPONENT_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata(
  props: PageProps<"/components/[slug]">
): Promise<Metadata> {
  const params = await props.params;
  if (!isComponentSlug(params.slug)) {
    notFound();
  }

  const page = source.getPage(["components", params.slug]);
  if (!page) {
    notFound();
  }

  const canonicalPath = `/components/${params.slug}`;

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
