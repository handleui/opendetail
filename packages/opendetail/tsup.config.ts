import { defineConfig } from "tsup";

export default defineConfig({
  clean: true,
  dts: true,
  entry: {
    cli: "src/cli.ts",
    constants: "src/constants.ts",
    errors: "src/errors.ts",
    index: "src/index.ts",
    runtime: "src/runtime.ts",
    types: "src/types.ts",
    validation: "src/validation.ts",
  },
  format: ["esm"],
  shims: false,
  sourcemap: true,
  splitting: false,
  target: "node18",
});
