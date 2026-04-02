import { createMDX } from "fumadocs-mdx/next";

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  allowedDevOrigins: ["opendetail.docs.localhost"],
  serverExternalPackages: ["@takumi-rs/image-response"],
  reactStrictMode: true,
};

export default withMDX(config);
