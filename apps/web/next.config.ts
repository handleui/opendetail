import path from "node:path";
import { createMDX } from "fumadocs-mdx/next";
import type { NextConfig } from "next";

const withMDX = createMDX();

const nextConfig: NextConfig = {
  reactCompiler: true,
  allowedDevOrigins: ["opendetail.localhost"],
  serverExternalPackages: ["@takumi-rs/image-response"],
  turbopack: {
    root: path.join(process.cwd(), "../.."),
  },
};

export default withMDX(nextConfig);
