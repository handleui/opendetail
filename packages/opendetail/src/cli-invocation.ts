import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";

/**
 * Whether this module is the process entrypoint. Resolves real paths so
 * `node_modules/.bin/*` symlinks (and tools like bunx/npx) match `import.meta.url`.
 */
export const isPrimaryModuleInvocation = (
  moduleImportMetaUrl: string
): boolean => {
  const argv1 = process.argv[1];
  if (typeof argv1 !== "string" || argv1.length === 0) {
    return false;
  }

  try {
    const modulePath = realpathSync(fileURLToPath(moduleImportMetaUrl));
    const invokedPath = realpathSync(argv1);
    return modulePath === invokedPath;
  } catch {
    return false;
  }
};
