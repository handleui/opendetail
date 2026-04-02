import {
  access,
  mkdir,
  readFile,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
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

  test("maps local media references and keeps public image URLs", async () => {
    const cwd = await createFixtureWorkspace("media");

    try {
      const { artifact } = await buildOpenDetailIndex({ cwd });
      const imageUrls = artifact.chunks.flatMap((chunk) =>
        (chunk.images ?? []).map((image) => image.url)
      );

      expect(imageUrls).toContain("/content-media/architecture.png");
      expect(imageUrls).toContain("/content-media/hero.png");
      expect(imageUrls).toContain("/content-media/widget.png");
      expect(imageUrls).toContain("/images/root-diagram.png");
      expect(imageUrls).toContain(
        "https://cdn.example.com/external-diagram.png"
      );
    } finally {
      await removeWorkspace(cwd);
    }
  });

  test("skips local image references when media mapping is not configured", async () => {
    const cwd = await createFixtureWorkspace("basic");
    const imageDirectory = path.join(cwd, "content", "docs", "assets");
    const imageFilePath = path.join(imageDirectory, "local.png");
    const markdownFilePath = path.join(cwd, "content", "docs", "images.md");

    try {
      await mkdir(imageDirectory, { recursive: true });
      await writeFile(imageFilePath, "local");
      await writeFile(
        markdownFilePath,
        `# Images

![Local image](./assets/local.png "Local title")
`
      );

      const { artifact } = await buildOpenDetailIndex({ cwd });
      const imageChunk = artifact.chunks.find(
        (chunk) => chunk.relativePath === "images.md"
      );

      expect(imageChunk?.images ?? []).toEqual([]);
    } finally {
      await removeWorkspace(cwd);
    }
  });

  test("ignores unsupported absolute image urls", async () => {
    const cwd = await createFixtureWorkspace("basic");
    const markdownFilePath = path.join(
      cwd,
      "content",
      "docs",
      "unsafe-images.md"
    );

    try {
      await writeFile(
        markdownFilePath,
        `# Unsafe images

![Protocol relative](//cdn.example.com/image.png)
![Data image](data:image/png;base64,abc)
`
      );

      const { artifact } = await buildOpenDetailIndex({ cwd });
      const imageChunk = artifact.chunks.find(
        (chunk) => chunk.relativePath === "unsafe-images.md"
      );

      expect(imageChunk?.images ?? []).toEqual([]);
    } finally {
      await removeWorkspace(cwd);
    }
  });

  test("fails when mapped local images are missing from configured media", async () => {
    const cwd = await createFixtureWorkspace("media");
    const markdownFilePath = path.join(cwd, "content", "docs", "missing.mdx");

    try {
      await writeFile(
        markdownFilePath,
        `# Missing image

![Missing local image](./assets/missing.png "Missing title")
`
      );

      await expect(buildOpenDetailIndex({ cwd })).rejects.toThrow(
        "does not resolve to a file matched by `[media].include`"
      );
    } finally {
      await removeWorkspace(cwd);
    }
  });

  test("updates the manifest hash when the media mapping set changes", async () => {
    const cwd = await createFixtureWorkspace("media");
    const extraMediaDirectory = path.join(cwd, "content", "marketing");
    const extraMediaFilePath = path.join(extraMediaDirectory, "banner.png");

    try {
      const initialBuild = await buildOpenDetailIndex({ cwd });
      const initialImageUrl =
        initialBuild.artifact.chunks[0]?.images?.[0]?.url ?? null;

      await mkdir(extraMediaDirectory, { recursive: true });
      await writeFile(extraMediaFilePath, "banner");

      const nextBuild = await buildOpenDetailIndex({ cwd });
      const nextImageUrl =
        nextBuild.artifact.chunks[0]?.images?.[0]?.url ?? null;

      expect(initialBuild.artifact.manifestHash).not.toBe(
        nextBuild.artifact.manifestHash
      );
      expect(initialImageUrl).not.toBe(nextImageUrl);
    } finally {
      await removeWorkspace(cwd);
    }
  });
});
