import {
  mkdtempSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { afterEach, describe, expect, test } from "vitest";
import { isPrimaryModuleInvocation } from "../src/cli-invocation";

const temporaryDirectories: string[] = [];

afterEach(() => {
  for (const dir of temporaryDirectories.splice(0)) {
    rmSync(dir, { force: true, recursive: true });
  }
});

describe("isPrimaryModuleInvocation", () => {
  test("returns true when argv[1] is a symlink to the module file", () => {
    const tempDirectory = mkdtempSync(
      path.join(tmpdir(), "opendetail-cli-inv-")
    );
    temporaryDirectories.push(tempDirectory);

    const realFile = path.join(tempDirectory, "real.mjs");
    writeFileSync(realFile, "export {}\n", "utf8");
    const linkFile = path.join(tempDirectory, "link.mjs");
    symlinkSync(realFile, linkFile, "file");

    const moduleUrl = pathToFileURL(realFile).href;
    const previousArgv1 = process.argv[1];

    process.argv[1] = linkFile;

    try {
      expect(isPrimaryModuleInvocation(moduleUrl)).toBe(true);
      expect(realpathSync(linkFile)).toBe(realpathSync(realFile));
    } finally {
      (process.argv as (string | undefined)[])[1] = previousArgv1;
    }
  });

  test("returns false when argv[1] points at a different file", () => {
    const tempDirectory = mkdtempSync(
      path.join(tmpdir(), "opendetail-cli-inv-")
    );
    temporaryDirectories.push(tempDirectory);

    const fileA = path.join(tempDirectory, "a.mjs");
    const fileB = path.join(tempDirectory, "b.mjs");
    writeFileSync(fileA, "export {}\n", "utf8");
    writeFileSync(fileB, "export {}\n", "utf8");

    const moduleUrl = pathToFileURL(fileA).href;
    const previousArgv1 = process.argv[1];

    process.argv[1] = fileB;

    try {
      expect(isPrimaryModuleInvocation(moduleUrl)).toBe(false);
    } finally {
      (process.argv as (string | undefined)[])[1] = previousArgv1;
    }
  });
});
