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
        destination: "/docs/core",
        permanent: true,
      },
      {
        source: "/docs/components",
        destination: "/components",
        permanent: true,
      },
      {
        source: "/docs/components/:path*",
        destination: "/components/:path*",
        permanent: true,
      },
      {
        source: "/docs/cli",
        destination: "/docs/cli/quickstart",
        permanent: true,
      },
      {
        source: "/docs/integration",
        destination: "/docs/quickstart",
        permanent: true,
      },
      {
        source: "/docs/opendetail",
        destination: "/docs/core",
        permanent: true,
      },
      {
        source: "/docs/configuration",
        destination: "/docs/core",
        permanent: true,
      },
      {
        source: "/docs/runtime",
        destination: "/docs/core",
        permanent: true,
      },
    ];
  },
};

export default withMDX(nextConfig);
