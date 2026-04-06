import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ConversationTitleDemo } from "@/components/component-demos/conversation-title-demo";
import { ErrorDemo } from "@/components/component-demos/error-demo";
import { InputDemo } from "@/components/component-demos/input-demo";
import { LoaderDemo } from "@/components/component-demos/loader-demo";
import { PressableDemo } from "@/components/component-demos/pressable-demo";
import { ShellDemo } from "@/components/component-demos/shell-demo";
import { SidebarDemo } from "@/components/component-demos/sidebar-demo";
import { SourcesDemo } from "@/components/component-demos/sources-demo";
import { SuggestionsDemo } from "@/components/component-demos/suggestions-demo";
import { ComponentPreviewSurface } from "@/components/component-preview-surface";
import { getDocsMdxComponents } from "@/components/docs-mdx-components";
import { DocsPageChrome } from "@/components/docs-page-chrome";
import {
  COMPONENT_DOCS_SLUGS,
  type ComponentDocsSlug,
  isComponentDocsSlug,
} from "@/lib/component-docs-slugs";
import { getComponentPreviewPreset } from "@/lib/component-preview-viewport";
import { knownSourcePageUrls } from "@/lib/known-source-page-urls";
import { gitConfig } from "@/lib/shared";
import { getPageImage, getPageMarkdownUrl, source } from "@/lib/source";

function ComponentPreview({ slug }: { slug: ComponentDocsSlug }) {
  switch (slug) {
    case "conversation-title":
      return <ConversationTitleDemo />;
    case "error":
      return <ErrorDemo />;
    case "input":
      return <InputDemo />;
    case "loader":
      return <LoaderDemo />;
    case "pressable":
      return <PressableDemo />;
    case "recommendations":
      return <SuggestionsDemo />;
    case "shell":
      return <ShellDemo knownSourcePageUrls={knownSourcePageUrls} />;
    case "sidebar":
      return <SidebarDemo knownSourcePageUrls={knownSourcePageUrls} />;
    case "sources":
      return <SourcesDemo />;
    default:
      return null;
  }
}

export default async function Page(props: PageProps<"/components/[slug]">) {
  const params = await props.params;
  if (!isComponentDocsSlug(params.slug)) {
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
          <ComponentPreviewSurface preset={getComponentPreviewPreset(params.slug)}>
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
  return COMPONENT_DOCS_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata(
  props: PageProps<"/components/[slug]">
): Promise<Metadata> {
  const params = await props.params;
  if (!isComponentDocsSlug(params.slug)) {
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
