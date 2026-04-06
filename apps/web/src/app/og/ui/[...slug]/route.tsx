import { ImageResponse } from "@takumi-rs/image-response";
import { generate as DefaultImage } from "fumadocs-ui/og/takumi";
import { notFound } from "next/navigation";
import { getUiPageImage, uiSource } from "@/lib/ui-source";

export const revalidate = false;

export async function GET(
  _req: Request,
  { params }: RouteContext<"/og/ui/[...slug]">
) {
  const { slug } = await params;
  const page = uiSource.getPage(slug.slice(0, -1));
  if (!page) {
    notFound();
  }

  return new ImageResponse(
    <DefaultImage
      description={page.data.description}
      site="OpenDetail"
      title={page.data.title}
    />,
    {
      width: 1200,
      height: 630,
      format: "webp",
    }
  );
}

export function generateStaticParams() {
  return uiSource.getPages().map((page) => ({
    lang: page.locale,
    slug: getUiPageImage(page).segments,
  }));
}
