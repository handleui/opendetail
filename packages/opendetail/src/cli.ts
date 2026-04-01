#!/usr/bin/env node

import { buildOpenDetailIndex } from "./build";
import { getErrorMessage } from "./utils";

const printUsage = (): void => {
  console.log(`Usage:
  opendetail build`);
};

const main = async (): Promise<void> => {
  const [command] = process.argv.slice(2);

  if (!command) {
    printUsage();
    process.exitCode = 1;
    return;
  }

  if (command !== "build") {
    console.error(`Unknown command: ${command}`);
    printUsage();
    process.exitCode = 1;
    return;
  }

  const { artifact, outputPath } = await buildOpenDetailIndex();

  console.log(
    `Built OpenDetail index with ${artifact.chunks.length} chunk${artifact.chunks.length === 1 ? "" : "s"} at ${outputPath}`
  );
};

main().catch((error: unknown) => {
  console.error(getErrorMessage(error));
  process.exitCode = 1;
});
