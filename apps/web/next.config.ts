import { fileURLToPath } from "node:url";
import { createMDX } from "fumadocs-mdx/next";
import type { NextConfig } from "next";

const withMDX = createMDX();
const repoRoot = fileURLToPath(new URL("../..", import.meta.url));

const nextConfig: NextConfig = {
  reactCompiler: true,
  allowedDevOrigins: ["opendetail.localhost"],
  serverExternalPackages: ["@takumi-rs/image-response"],
  transpilePackages: [
    "opendetail",
    "opendetail-react",
    "opendetail-next",
    "opendetail-fumadocs",
  ],
  turbopack: {
    root: repoRoot,
  },
  redirects() {
    return [
      {
        source: "/docs/guide",
        destination: "/docs/quickstart",
        permanent: true,
      },
      {
        source: "/docs/reference",
        destination: "/docs/configuration",
        permanent: true,
      },
    ];
  },
};

export default withMDX(nextConfig);
