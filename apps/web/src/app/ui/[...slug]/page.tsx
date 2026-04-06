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
import { getComponentPreviewPreset } from "@/lib/component-preview-viewport";
import { knownSourcePageUrls } from "@/lib/known-source-page-urls";
import { gitConfig } from "@/lib/shared";
import { getPageImage, getPageMarkdownUrl, source } from "@/lib/source";
import { UI_DOC_SLUG_PATHS } from "@/lib/ui-docs-static-paths";
import {
  isUiOpendetailPreviewSlug,
  type UiOpendetailPreviewSlug,
} from "@/lib/ui-opendetail-preview-slugs";

function UiOpendetailPreview({ slug }: { slug: UiOpendetailPreviewSlug }) {
  switch (slug) {
    case "conversation-title":
      return <ConversationTitleDemo />;
    case "error":
      return <ErrorDemo />;
    case "composer":
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

export default async function Page(props: PageProps<"/ui/[...slug]">) {
  const params = await props.params;
  const segments = params.slug;
  const page = source.getPage(["ui", ...segments]);
  if (!page) {
    notFound();
  }

  const MDX = page.data.body;
  const markdownUrl = getPageMarkdownUrl(page).url;
  const githubUrl = `https://github.com/${gitConfig.user}/${gitConfig.repo}/blob/${gitConfig.branch}/content/docs/${page.path}`;
  const toc = page.data.toc ?? [];

  const previewSlug =
    segments[0] === "opendetail" && segments.length === 2
      ? segments[1]
      : undefined;
  const showPreview =
    previewSlug !== undefined && isUiOpendetailPreviewSlug(previewSlug);

  return (
    <article className="docs-article pb-16">
      <DocsPageChrome
        feedbackPath={page.url}
        githubUrl={githubUrl}
        markdownUrl={markdownUrl}
        pageTitle={page.data.title}
        preview={
          showPreview ? (
            <ComponentPreviewSurface
              preset={getComponentPreviewPreset(previewSlug)}
            >
              <UiOpendetailPreview slug={previewSlug} />
            </ComponentPreviewSurface>
          ) : undefined
        }
        toc={toc}
        variant="theme"
      >
        <MDX components={getDocsMdxComponents(source, page)} />
      </DocsPageChrome>
    </article>
  );
}

export function generateStaticParams() {
  return UI_DOC_SLUG_PATHS.map((slug) => ({ slug }));
}

export async function generateMetadata(
  props: PageProps<"/ui/[...slug]">
): Promise<Metadata> {
  const params = await props.params;
  const segments = params.slug;
  const page = source.getPage(["ui", ...segments]);
  if (!page) {
    notFound();
  }

  const canonicalPath = `/ui/${segments.join("/")}`;

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
