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
      // Deleted pages — redirect to their new homes
      {
        source: "/docs",
        destination: "/docs/quickstart",
        permanent: true,
      },
      {
        source: "/docs/packages",
        destination: "/docs/quickstart",
        permanent: true,
      },
      {
        source: "/docs/ui-integration",
        destination: "/docs/react",
        permanent: true,
      },
      {
        source: "/docs/design-system",
        destination: "/docs/react",
        permanent: true,
      },
      {
        source: "/docs/hooks",
        destination: "/docs/react",
        permanent: true,
      },
      {
        source: "/docs/hooks/:path*",
        destination: "/docs/react",
        permanent: true,
      },
      // Legacy doc URLs
      {
        source: "/docs/guide",
        destination: "/docs/quickstart",
        permanent: true,
      },
      {
        source: "/docs/integration",
        destination: "/docs/quickstart",
        permanent: true,
      },
      {
        source: "/docs/reference",
        destination: "/docs/core",
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
      {
        source: "/docs/cli/quickstart",
        destination: "/docs/cli",
        permanent: true,
      },
      {
        source: "/docs/cli/commands",
        destination: "/docs/cli",
        permanent: true,
      },
      {
        source: "/docs/cli/build",
        destination: "/docs/cli",
        permanent: true,
      },
      {
        source: "/docs/cli/setup",
        destination: "/docs/cli",
        permanent: true,
      },
      {
        source: "/docs/cli/doctor",
        destination: "/docs/cli",
        permanent: true,
      },
      // Old /themes/* and /ui/* and /components/* paths — all styling content now lives at /docs/react
      {
        source: "/themes/opendetail/systems-and-themes",
        destination: "/docs/react",
        permanent: true,
      },
      {
        source: "/themes/opendetail/themes/midnight",
        destination: "/docs/react",
        permanent: true,
      },
      {
        source: "/themes/opendetail/themes/signal",
        destination: "/docs/react",
        permanent: true,
      },
      {
        source: "/themes/opendetail/hooks/:path*",
        destination: "/docs/react",
        permanent: true,
      },
      {
        source: "/themes/opendetail/hooks",
        destination: "/docs/react",
        permanent: true,
      },
      {
        source: "/themes/opendetail/:path*",
        destination: "/docs/react",
        permanent: true,
      },
      {
        source: "/themes/opendetail",
        destination: "/docs/react",
        permanent: true,
      },
      {
        source: "/ui/systems-and-themes",
        destination: "/docs/react",
        permanent: true,
      },
      {
        source: "/ui/systems",
        destination: "/docs/react",
        permanent: true,
      },
      {
        source: "/ui/themes",
        destination: "/docs/react",
        permanent: true,
      },
      {
        source: "/ui/primitives",
        destination: "/docs/react",
        permanent: true,
      },
      {
        source: "/components/systems-and-themes",
        destination: "/docs/react",
        permanent: true,
      },
      {
        source: "/components/hooks/:path*",
        destination: "/docs/react",
        permanent: true,
      },
      {
        source: "/components/hooks",
        destination: "/docs/react",
        permanent: true,
      },
      {
        source: "/components/:path*",
        destination: "/docs/react",
        permanent: true,
      },
      {
        source: "/components",
        destination: "/docs/react",
        permanent: true,
      },
      {
        source: "/docs/components/systems-and-themes",
        destination: "/docs/react",
        permanent: true,
      },
      {
        source: "/docs/components/hooks/:path*",
        destination: "/docs/react",
        permanent: true,
      },
      {
        source: "/docs/components/hooks",
        destination: "/docs/react",
        permanent: true,
      },
      {
        source: "/docs/components/:path*",
        destination: "/docs/react",
        permanent: true,
      },
      {
        source: "/docs/components",
        destination: "/docs/react",
        permanent: true,
      },
    ];
  },
};

export default withMDX(nextConfig);
