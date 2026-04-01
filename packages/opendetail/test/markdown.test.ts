import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, test } from "vitest";
import { extractMarkdownChunks } from "../src/markdown";

describe("extractMarkdownChunks", () => {
  test("keeps headings, paragraphs, lists, and code blocks", () => {
    const chunks = extractMarkdownChunks({
      config: {
        base_path: "/docs",
      },
      fileContent: `# Guide

Intro paragraph.

- first item
- second item

## Code

\`\`\`ts
const answer = true;
\`\`\`
`,
      filePath: "/tmp/guide.md",
      relativePath: "guide.md",
    });

    expect(chunks).toHaveLength(2);
    expect(chunks[0]?.text).toContain("Guide");
    expect(chunks[0]?.text).toContain("first item");
    expect(chunks[1]?.text).toContain("const answer = true;");
    expect(chunks[1]?.url).toBe("/docs/guide#code");
  });

  test("keeps MDX text while ignoring imports and exports", async () => {
    const fixturePath = path.resolve(
      import.meta.dirname,
      "fixtures",
      "mdx",
      "content",
      "guides",
      "composition.mdx"
    );
    const fileContent = await readFile(fixturePath, "utf8");
    const chunks = extractMarkdownChunks({
      config: {
        base_path: "/guides",
      },
      fileContent,
      filePath: fixturePath,
      relativePath: "composition.mdx",
    });
    const combinedText = chunks.map((chunk) => chunk.text).join("\n");

    expect(combinedText).toContain(
      "Inline MDX content still matters for the extracted text."
    );
    expect(combinedText).toContain("The runtime stays on the server.");
    expect(combinedText).not.toContain(
      'export const meta = { section: "Guides" }'
    );
    expect(combinedText).not.toContain('import Demo from "./demo"');
  });

  test("splits long sections by paragraph groups", () => {
    const bigParagraphs = Array.from(
      { length: 4 },
      (_, index) => `Paragraph ${index + 1} ${"details ".repeat(70).trim()}`
    ).join("\n\n");
    const chunks = extractMarkdownChunks({
      config: {
        base_path: "/docs",
      },
      fileContent: `# Big Guide

## Large Section

${bigParagraphs}
`,
      filePath: "/tmp/big-guide.md",
      relativePath: "big-guide.md",
    }).filter((chunk) => chunk.url === "/docs/big-guide#large-section");

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0]?.text).toContain("Large Section");
    expect(chunks[0]?.text).toContain("Paragraph 1");
    expect(chunks[1]?.text).not.toContain("Paragraph 1");
  });
});
