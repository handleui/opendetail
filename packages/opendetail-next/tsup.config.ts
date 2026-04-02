import { defineConfig } from "tsup";

export default defineConfig({
  clean: true,
  dts: true,
  entry: {
    index: "src/index.ts",
    link: "src/link.tsx",
  },
  format: ["esm"],
  shims: false,
  sourcemap: true,
  splitting: false,
  target: "es2022",
});
