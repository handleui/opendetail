import path from "node:path";
import { OPENDETAIL_INDEX_FILE } from "./constants";

export const resolveIndexPath = (
  cwd: string,
  outputPath = OPENDETAIL_INDEX_FILE
): string => path.resolve(/* turbopackIgnore: true */ cwd, outputPath);
