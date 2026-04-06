import { fileURLToPath } from "node:url";
import { createMDX } from "fumadocs-mdx/next";
import type { NextConfig } from "next";

const withMDX = createMDX();
const repoRoot = fileURLToPath(new URL("../..", import.meta.url));

const nextConfig: NextConfig = {
  reactCompiler: true,
  allowedDevOrigins: ["opendetail.localhost"],
  serverExternalPackages: ["@takumi-rs/image-response"],
  // Ensure the prebuilt lexical index is present in the Node serverless bundle (Vercel / output file tracing).
  outputFileTracingIncludes: {
    "/api/opendetail": ["./.opendetail/index.json"],
  },
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
        source: "/themes/opendetail/systems-and-themes",
        destination: "/ui/systems-and-themes",
        permanent: true,
      },
      {
        source: "/themes/opendetail/hooks/:path*",
        destination: "/ui/hooks/:path*",
        permanent: true,
      },
      {
        source: "/themes/opendetail/hooks",
        destination: "/ui/hooks",
        permanent: true,
      },
      {
        source: "/themes/opendetail",
        destination: "/ui/opendetail",
        permanent: true,
      },
      {
        source: "/themes/opendetail/:path*",
        destination: "/ui/opendetail/:path*",
        permanent: true,
      },
      {
        source: "/components/systems-and-themes",
        destination: "/ui/systems-and-themes",
        permanent: true,
      },
      {
        source: "/components/hooks/:path*",
        destination: "/ui/hooks/:path*",
        permanent: true,
      },
      {
        source: "/components/hooks",
        destination: "/ui/hooks",
        permanent: true,
      },
      {
        source: "/components",
        destination: "/ui",
        permanent: true,
      },
      {
        source: "/components/:path*",
        destination: "/ui/opendetail/:path*",
        permanent: true,
      },
      {
        source: "/docs/components/systems-and-themes",
        destination: "/ui/systems-and-themes",
        permanent: true,
      },
      {
        source: "/docs/components/hooks/:path*",
        destination: "/ui/hooks/:path*",
        permanent: true,
      },
      {
        source: "/docs/components/hooks",
        destination: "/ui/hooks",
        permanent: true,
      },
      {
        source: "/docs/components",
        destination: "/ui",
        permanent: true,
      },
      {
        source: "/docs/components/:path*",
        destination: "/ui/opendetail/:path*",
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
