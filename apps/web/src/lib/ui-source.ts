import { assistantUi } from "collections/server";
import { type InferPageType, loader } from "fumadocs-core/source";
import { lucideIconsPlugin } from "fumadocs-core/source/lucide-icons";

import { uiContentRoute, uiImageRoute, uiRoute } from "@/lib/shared";

export const uiSource = loader({
  baseUrl: uiRoute,
  source: assistantUi.toFumadocsSource(),
  plugins: [lucideIconsPlugin()],
});

export type UiPage = InferPageType<typeof uiSource>;

export function getUiPageImage(page: UiPage) {
  const segments = [...page.slugs, "image.webp"];

  return {
    segments,
    url: `${uiImageRoute}/${segments.join("/")}`,
  };
}

export function getUiPageMarkdownUrl(page: UiPage) {
  const segments = [...page.slugs, "content.md"];

  return {
    segments,
    url: `${uiContentRoute}/${segments.join("/")}`,
  };
}

export async function getUiLLMText(page: UiPage) {
  const processed = await page.data.getText("processed");

  return `# ${page.data.title} (${page.url})

${processed}`;
}
