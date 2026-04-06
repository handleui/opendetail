import { mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, test } from "vitest";
import { readOpenDetailConfig } from "../src/config";
import { removeWorkspace } from "./helpers";

describe("readOpenDetailConfig", () => {
  test("parses and normalizes the MVP config file", async () => {
    const cwd = path.resolve(import.meta.dirname, "fixtures", "basic");

    await expect(readOpenDetailConfig({ cwd })).resolves.toEqual({
      content: [
        {
          exclude: [],
          include: ["content/**/*.md", "content/**/*.mdx"],
          public_path: "/docs",
        },
      ],
      version: 1,
    });
  });

  test("parses optional media config", async () => {
    const cwd = path.resolve(import.meta.dirname, "fixtures", "media");

    await expect(readOpenDetailConfig({ cwd })).resolves.toEqual({
      content: [
        {
          exclude: [],
          include: ["content/**/*.md", "content/**/*.mdx"],
          public_path: "/docs",
        },
      ],
      media: {
        exclude: [],
        include: ["content/**/*.{png,webp,svg}"],
        public_path: "/content-media",
      },
      version: 1,
    });
  });

  test("rejects invalid config values", async () => {
    const cwd = await mkdtemp(path.join(os.tmpdir(), "opendetail-config-"));

    try {
      await writeFile(
        path.join(cwd, "opendetail.toml"),
        `version = 1
[[content]]
include = []
exclude = []
public_path = "docs"
`
      );

      await expect(readOpenDetailConfig({ cwd })).rejects.toThrow(
        "Invalid OpenDetail config"
      );
    } finally {
      await removeWorkspace(cwd);
    }
  });

  test("parses optional [fetch] (OpenAI tools)", async () => {
    const cwd = await mkdtemp(path.join(os.tmpdir(), "opendetail-config-"));

    try {
      await writeFile(
        path.join(cwd, "opendetail.toml"),
        `version = 1

[[content]]
include = ["content/**/*.md"]
exclude = []
public_path = "/docs"

[fetch.file_search]
vector_store_ids = ["vs_docs_123"]
max_num_results = 8

[fetch.web_search]
allowed_domains = ["docs.example.com"]
search_context_size = "low"
`
      );

      await expect(readOpenDetailConfig({ cwd })).resolves.toEqual({
        content: [
          {
            exclude: [],
            include: ["content/**/*.md"],
            public_path: "/docs",
          },
        ],
        fetch: {
          file_search: {
            max_num_results: 8,
            vector_store_ids: ["vs_docs_123"],
          },
          web_search: {
            allowed_domains: ["docs.example.com"],
            search_context_size: "low",
          },
        },
        version: 1,
      });
    } finally {
      await removeWorkspace(cwd);
    }
  });

  test("parses optional second content root", async () => {
    const cwd = await mkdtemp(path.join(os.tmpdir(), "opendetail-config-"));

    try {
      await writeFile(
        path.join(cwd, "opendetail.toml"),
        `version = 1

[[content]]
include = ["content/**/*.md"]
exclude = []
public_path = "/docs"

[[content]]
public_path = "/"
include = ["marketing/**/*.mdx"]
exclude = ["**/draft/**"]
`
      );

      await expect(readOpenDetailConfig({ cwd })).resolves.toEqual({
        content: [
          {
            exclude: [],
            include: ["content/**/*.md"],
            public_path: "/docs",
          },
          {
            exclude: ["**/draft/**"],
            include: ["marketing/**/*.mdx"],
            public_path: "/",
          },
        ],
        version: 1,
      });
    } finally {
      await removeWorkspace(cwd);
    }
  });
});
