import { access, readFile, rm, symlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, test } from "vitest";
import { buildOpenDetailIndex } from "../src/build";
import { createFixtureWorkspace, removeWorkspace } from "./helpers";

const ISO_TIMESTAMP_PREFIX_REGEX = /^\d{4}-\d{2}-\d{2}T/u;

describe("buildOpenDetailIndex", () => {
  test("builds the index artifact from fixture docs", async () => {
    const cwd = await createFixtureWorkspace("basic");

    try {
      const { artifact, outputPath } = await buildOpenDetailIndex({ cwd });

      await expect(access(outputPath)).resolves.toBeUndefined();
      expect(artifact.version).toBe(1);
      expect(artifact.generatedAt).toMatch(ISO_TIMESTAMP_PREFIX_REGEX);
      expect(artifact.manifestHash).toHaveLength(64);
      expect(artifact.chunks.length).toBeGreaterThan(0);
      expect(
        artifact.chunks.some((chunk) => chunk.url === "/docs/advanced")
      ).toBe(true);
      expect(
        artifact.chunks.some(
          (chunk) => chunk.url === "/docs/getting-started#install"
        )
      ).toBe(true);
      expect(
        artifact.chunks.every((chunk) =>
          [
            "advanced/index.md",
            "configuration.md",
            "getting-started.mdx",
          ].includes(chunk.relativePath)
        )
      ).toBe(true);

      const serializedArtifact = await readFile(outputPath, "utf8");
      expect(serializedArtifact).toContain('"version": 1');
      expect(serializedArtifact).toContain('"manifestHash"');
    } finally {
      await removeWorkspace(cwd);
    }
  });

  test("writes custom output paths outside the default directory", async () => {
    const cwd = await createFixtureWorkspace("basic");

    try {
      const outputPath = "artifacts/opendetail/index.json";
      const result = await buildOpenDetailIndex({
        cwd,
        outputPath,
      });

      expect(result.outputPath).toBe(path.resolve(cwd, outputPath));
      await expect(access(result.outputPath)).resolves.toBeUndefined();
    } finally {
      await removeWorkspace(cwd);
    }
  });

  test("does not index symlinked files that resolve outside the workspace", async () => {
    const cwd = await createFixtureWorkspace("basic");
    const externalFilePath = `${cwd}-external.md`;
    const symlinkPath = path.join(cwd, "content", "external.md");

    try {
      await writeFile(externalFilePath, "# Secret\n\nDo not index this.\n");
      await symlink(externalFilePath, symlinkPath);

      const { artifact } = await buildOpenDetailIndex({ cwd });

      expect(
        artifact.chunks.some((chunk) => chunk.relativePath === "external.md")
      ).toBe(false);
    } finally {
      await rm(externalFilePath, { force: true });
      await removeWorkspace(cwd);
    }
  });
});
