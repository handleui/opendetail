import { defineConfig } from "tsup";

export default defineConfig({
  clean: true,
  dts: true,
  entry: {
    index: "src/index.ts",
    sidebar: "src/sidebar.tsx",
  },
  format: ["esm"],
  shims: false,
  sourcemap: true,
  splitting: false,
  target: "es2022",
});
