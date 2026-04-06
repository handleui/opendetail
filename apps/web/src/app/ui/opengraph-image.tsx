import { ImageResponse } from "@takumi-rs/image-response";
import { generate as DefaultImage } from "fumadocs-ui/og/takumi";

export default function Image() {
  return new ImageResponse(
    <DefaultImage
      description="Interactive previews for OpenDetail React primitives."
      site="OpenDetail"
      title="UI sandbox"
    />,
    {
      width: 1200,
      height: 630,
      format: "webp",
    }
  );
}
