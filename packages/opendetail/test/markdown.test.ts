import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, test } from "vitest";
import { extractMarkdownChunks } from "../src/markdown";

describe("extractMarkdownChunks", () => {
  test("keeps headings, paragraphs, lists, and code blocks", () => {
    const chunks = extractMarkdownChunks({
      config: {
        public_path: "/docs",
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
      filePath: "/tmp/quickstart.md",
      relativePath: "quickstart.md",
    });

    expect(chunks).toHaveLength(2);
    expect(chunks[0]?.text).toContain("Guide");
    expect(chunks[0]?.text).toContain("first item");
    expect(chunks[1]?.text).toContain("const answer = true;");
    expect(chunks[1]?.url).toBe("/docs/quickstart#code");
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
        public_path: "/guides",
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
        public_path: "/docs",
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

  test("extracts markdown image metadata for a section", () => {
    const chunks = extractMarkdownChunks({
      config: {
        public_path: "/docs",
      },
      fileContent: `# Visual Guide

![Architecture overview](./diagram.png "Diagram title")
`,
      filePath: "/tmp/visual-guide.md",
      relativePath: "visual-guide.md",
      resolveImage: (image) => ({
        ...image,
        url: `mapped:${image.url}`,
      }),
    });

    expect(chunks[0]?.images).toEqual([
      {
        alt: "Architecture overview",
        title: "Diagram title",
        url: "mapped:./diagram.png",
      },
    ]);
  });

  test("resolves reference-style markdown images", () => {
    const chunks = extractMarkdownChunks({
      config: {
        public_path: "/docs",
      },
      fileContent: `# Visual Guide

![Hero diagram][hero]

[hero]: ./hero.png "Hero title"
`,
      filePath: "/tmp/visual-guide.md",
      relativePath: "visual-guide.md",
      resolveImage: (image) => image,
    });

    expect(chunks[0]?.images).toEqual([
      {
        alt: "Hero diagram",
        title: "Hero title",
        url: "./hero.png",
      },
    ]);
  });

  test("extracts simple MDX image elements with literal src values", () => {
    const chunks = extractMarkdownChunks({
      config: {
        public_path: "/docs",
      },
      fileContent: `# Visual Guide

<Image src="./widget.png" alt="Workflow widget diagram" title="Widget title" />
<img src="/images/root.png" alt="Root image" title="Root title" />
`,
      filePath: "/tmp/visual-guide.mdx",
      relativePath: "visual-guide.mdx",
      resolveImage: (image) => image,
    });

    expect(chunks[0]?.images).toEqual([
      {
        alt: "Workflow widget diagram",
        title: "Widget title",
        url: "./widget.png",
      },
      {
        alt: "Root image",
        title: "Root title",
        url: "/images/root.png",
      },
    ]);
    expect(chunks[0]?.text).toContain("Workflow widget diagram");
    expect(chunks[0]?.text).toContain("Widget title");
  });
});
