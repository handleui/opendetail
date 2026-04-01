import path from "node:path";
import GithubSlugger from "github-slugger";
import matter from "gray-matter";
import { toString as markdownToString } from "mdast-util-to-string";
import remarkMdx from "remark-mdx";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { EXIT, visit } from "unist-util-visit";
import { DEFAULT_BASE_PATH, DEFAULT_CHUNK_CHARACTER_LIMIT } from "./constants";
import type { OpenDetailChunk, OpenDetailConfig } from "./types";
import {
  createChunkId,
  joinUrlPath,
  normalizeBasePath,
  stripMarkdownExtension,
  stripTrailingIndex,
  toPosixPath,
} from "./utils";

const WINDOWS_NEWLINES_REGEX = /\r\n/gu;
const EXTRA_NEWLINES_REGEX = /\n{3,}/gu;
const TITLE_SEGMENT_SPLIT_REGEX = /[-_]/u;

interface MarkdownNode {
  children?: MarkdownNode[];
  depth?: number;
  type: string;
  value?: string;
}

type MarkdownRoot = MarkdownNode & {
  children: MarkdownNode[];
  type: "root";
};

interface MarkdownSection {
  anchor: string | null;
  blocks: string[];
  headings: string[];
}

const parser = unified().use(remarkParse).use(remarkMdx);

const IGNORED_NODE_TYPES = new Set([
  "html",
  "mdxFlowExpression",
  "mdxjsEsm",
  "mdxTextExpression",
  "thematicBreak",
]);

const normalizeBlockText = (value: string): string =>
  value
    .replace(WINDOWS_NEWLINES_REGEX, "\n")
    .replace(EXTRA_NEWLINES_REGEX, "\n\n")
    .trim();

const createDefaultTitle = (relativePath: string): string => {
  const normalizedPath = stripTrailingIndex(
    stripMarkdownExtension(relativePath)
  );
  const fileName = normalizedPath.split("/").filter(Boolean).at(-1) ?? "index";

  return fileName
    .split(TITLE_SEGMENT_SPLIT_REGEX)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
};

const extractFirstHeading = (tree: MarkdownRoot): string | null => {
  let firstHeading: string | null = null;

  visit(tree, (node: MarkdownNode) => {
    if (node.type !== "heading") {
      return;
    }

    const headingText = normalizeBlockText(markdownToString(node));

    if (headingText.length === 0) {
      return;
    }

    firstHeading = headingText;
    return EXIT;
  });

  return firstHeading;
};

const extractBlockText = (node: MarkdownNode): string => {
  if (IGNORED_NODE_TYPES.has(node.type)) {
    return "";
  }

  if (node.type === "code") {
    return normalizeBlockText(node.value ?? "");
  }

  return normalizeBlockText(markdownToString(node));
};

const createBaseUrl = (
  relativePath: string,
  config: Pick<OpenDetailConfig, "base_path">
): string => {
  const normalizedBasePath = normalizeBasePath(
    config.base_path || DEFAULT_BASE_PATH
  );
  const relativeRoutePath = stripTrailingIndex(
    stripMarkdownExtension(toPosixPath(relativePath))
  );

  return joinUrlPath(normalizedBasePath, relativeRoutePath);
};

const createChunkUrl = (baseUrl: string, anchor: string | null): string =>
  anchor ? `${baseUrl}#${anchor}` : baseUrl;

const createHeadingSection = (
  headingText: string,
  headingStack: string[],
  anchor: string | null
): MarkdownSection => ({
  anchor,
  blocks: [headingText],
  headings: [...headingStack],
});

const shouldUseBaseUrlForHeading = ({
  currentSection,
  headingDepth,
  headingText,
  sections,
  title,
}: {
  currentSection: MarkdownSection;
  headingDepth: number;
  headingText: string;
  sections: MarkdownSection[];
  title: string;
}): boolean =>
  sections.length === 0 &&
  currentSection.blocks.length === 0 &&
  headingDepth === 1 &&
  headingText === title;

const createNextSectionFromHeading = ({
  child,
  currentSection,
  headingStack,
  sections,
  slugger,
  title,
}: {
  child: MarkdownNode;
  currentSection: MarkdownSection;
  headingStack: Array<{ depth: number; text: string }>;
  sections: MarkdownSection[];
  slugger: GithubSlugger;
  title: string;
}): MarkdownSection | null => {
  const headingText = extractBlockText(child);

  if (headingText.length === 0) {
    return null;
  }

  const headingDepth = child.depth ?? 1;
  const nextHeadingStack = headingStack.filter(
    (heading) => heading.depth < headingDepth
  );

  nextHeadingStack.push({
    depth: headingDepth,
    text: headingText,
  });
  headingStack.length = 0;
  headingStack.push(...nextHeadingStack);

  const anchor = shouldUseBaseUrlForHeading({
    currentSection,
    headingDepth,
    headingText,
    sections,
    title,
  })
    ? null
    : slugger.slug(headingText);

  return createHeadingSection(
    headingText,
    nextHeadingStack.map((heading) => heading.text),
    anchor
  );
};

const splitSectionIntoChunks = (
  filePath: string,
  relativePath: string,
  title: string,
  baseUrl: string,
  section: MarkdownSection,
  characterLimit = DEFAULT_CHUNK_CHARACTER_LIMIT
): OpenDetailChunk[] => {
  const groups: string[][] = [];
  let currentGroup: string[] = [];
  let currentLength = 0;

  for (const block of section.blocks) {
    const nextLength =
      currentLength + block.length + (currentGroup.length === 0 ? 0 : 2);

    if (currentGroup.length > 0 && nextLength > characterLimit) {
      groups.push(currentGroup);
      currentGroup = [block];
      currentLength = block.length;
      continue;
    }

    currentGroup.push(block);
    currentLength = nextLength;
  }

  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }

  if (groups.length === 0) {
    groups.push([]);
  }

  return groups.map((group, index) => ({
    anchor: section.anchor,
    filePath,
    headings: [...section.headings],
    id: createChunkId(relativePath, section.anchor, index),
    relativePath,
    text: group.join("\n\n").trim(),
    title,
    url: createChunkUrl(baseUrl, section.anchor),
  }));
};

export const extractMarkdownChunks = ({
  config,
  fileContent,
  filePath,
  relativePath,
}: {
  config: Pick<OpenDetailConfig, "base_path">;
  fileContent: string;
  filePath: string;
  relativePath: string;
}): OpenDetailChunk[] => {
  const { content, data } = matter(fileContent);
  const tree = parser.parse(content) as MarkdownRoot;
  const slugger = new GithubSlugger();
  const frontmatterTitle =
    typeof data.title === "string" ? normalizeBlockText(data.title) : "";
  const firstHeading = extractFirstHeading(tree) ?? "";
  const title =
    frontmatterTitle || firstHeading || createDefaultTitle(relativePath);
  const baseUrl = createBaseUrl(relativePath, config);
  const sections: MarkdownSection[] = [];
  const headingStack: Array<{ depth: number; text: string }> = [];
  let currentSection: MarkdownSection = {
    anchor: null,
    blocks: [],
    headings: [title],
  };

  for (const child of tree.children) {
    if (child.type === "heading") {
      if (currentSection.blocks.length > 0) {
        sections.push(currentSection);
      }

      const nextSection = createNextSectionFromHeading({
        child,
        currentSection,
        headingStack,
        sections,
        slugger,
        title,
      });

      if (!nextSection) {
        continue;
      }

      currentSection = nextSection;
      continue;
    }

    const blockText = extractBlockText(child);

    if (blockText.length === 0) {
      continue;
    }

    currentSection.blocks.push(blockText);
  }

  if (currentSection.blocks.length > 0) {
    sections.push(currentSection);
  }

  if (sections.length === 0) {
    sections.push({
      anchor: null,
      blocks: [title],
      headings: [title],
    });
  }

  return sections.flatMap((section) =>
    splitSectionIntoChunks(filePath, relativePath, title, baseUrl, section)
  );
};

export const createRelativeChunkPath = (
  commonRoot: string,
  filePath: string
): string => {
  const normalizedFilePath = toPosixPath(filePath);
  const normalizedRoot = toPosixPath(commonRoot);

  if (normalizedRoot.length === 0) {
    return normalizedFilePath;
  }

  return toPosixPath(path.posix.relative(normalizedRoot, normalizedFilePath));
};
