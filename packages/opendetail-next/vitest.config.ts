import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const resolveFromHere = (relativePath: string): string =>
  fileURLToPath(new URL(relativePath, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "opendetail/constants": resolveFromHere("../opendetail/src/constants.ts"),
      "opendetail/errors": resolveFromHere("../opendetail/src/errors.ts"),
      "opendetail/runtime": resolveFromHere("../opendetail/src/runtime.ts"),
      "opendetail/types": resolveFromHere("../opendetail/src/types.ts"),
      "opendetail/validation": resolveFromHere(
        "../opendetail/src/validation.ts"
      ),
      opendetail: resolveFromHere("../opendetail/src/index.ts"),
      "opendetail-react": resolveFromHere("../opendetail-react/src/index.ts"),
    },
  },
});
