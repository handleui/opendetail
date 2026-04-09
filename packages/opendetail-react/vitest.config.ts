import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const resolveFromHere = (relativePath: string): string =>
  fileURLToPath(new URL(relativePath, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "opendetail-client": resolveFromHere("../opendetail-client/src/index.ts"),
    },
  },
});
