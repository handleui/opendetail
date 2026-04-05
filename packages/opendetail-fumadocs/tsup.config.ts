import { defineConfig } from "tsup";

export default defineConfig({
  clean: true,
  dts: true,
  entry: {
    assistant: "src/assistant.tsx",
    index: "src/index.ts",
  },
  format: ["esm"],
  shims: false,
  sourcemap: true,
  splitting: false,
  target: "es2022",
});
