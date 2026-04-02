import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const resolveFromHere = (relativePath: string): string =>
  fileURLToPath(new URL(relativePath, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      opendetail: resolveFromHere("../opendetail/src/index.ts"),
      "opendetail-next": resolveFromHere("../opendetail-next/src/index.ts"),
      "opendetail-next/link": resolveFromHere(
        "../opendetail-next/src/link.tsx"
      ),
      "opendetail-react": resolveFromHere("../opendetail-react/src/index.ts"),
    },
  },
});
