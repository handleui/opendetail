import { notFound } from "next/navigation";
import { getUiLLMText, getUiPageMarkdownUrl, uiSource } from "@/lib/ui-source";

export const revalidate = false;

export async function GET(
  _req: Request,
  { params }: RouteContext<"/llms.mdx/ui/[[...slug]]">
) {
  const { slug } = await params;
  const page = uiSource.getPage(slug?.slice(0, -1));
  if (!page) {
    notFound();
  }

  return new Response(await getUiLLMText(page), {
    headers: {
      "Content-Type": "text/markdown",
    },
  });
}

export function generateStaticParams() {
  return uiSource.getPages().map((page) => ({
    lang: page.locale,
    slug: getUiPageMarkdownUrl(page).segments,
  }));
}
