import path from "node:path";
import GithubSlugger from "github-slugger";
import matter from "gray-matter";
import { toString as markdownToString } from "mdast-util-to-string";
import remarkMdx from "remark-mdx";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { EXIT, visit } from "unist-util-visit";
import { DEFAULT_BASE_PATH, DEFAULT_CHUNK_CHARACTER_LIMIT } from "./constants";
import type {
  OpenDetailChunk,
  OpenDetailChunkImage,
  OpenDetailConfig,
} from "./types";
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
const SUPPORTED_MDX_IMAGE_NAMES = new Set(["Image", "img"]);

interface MarkdownJsxAttribute {
  name?: string;
  type: string;
  value?: string | null;
}

interface MarkdownNode {
  alt?: string | null;
  attributes?: MarkdownJsxAttribute[];
  children?: MarkdownNode[];
  depth?: number;
  identifier?: string;
  name?: string | null;
  title?: string | null;
  type: string;
  url?: string;
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
  images: OpenDetailChunkImage[];
}

interface MarkdownImageCandidate {
  alt: string | null;
  title: string | null;
  url: string;
}

interface MarkdownImageDefinition {
  title: string | null;
  url: string;
}

const parser = unified().use(remarkParse).use(remarkMdx);

const IGNORED_NODE_TYPES = new Set([
  "definition",
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

const normalizeOptionalText = (
  value: string | null | undefined
): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const normalizedValue = normalizeBlockText(value);

  return normalizedValue.length > 0 ? normalizedValue : null;
};

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
  images: [],
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
  currentSection.images.length === 0 &&
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

const pushUniqueImages = (
  targetImages: OpenDetailChunkImage[],
  images: OpenDetailChunkImage[]
): void => {
  for (const image of images) {
    if (targetImages.some((existingImage) => existingImage.url === image.url)) {
      continue;
    }

    targetImages.push(image);
  }
};

const splitSectionIntoChunks = (
  filePath: string,
  relativePath: string,
  chunkIdPath: string,
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
    groups.push([section.headings.at(-1) ?? title]);
  }

  return groups.map((group, index) => ({
    anchor: section.anchor,
    filePath,
    headings: [...section.headings],
    id: createChunkId(chunkIdPath, section.anchor, index),
    images: [...section.images],
    relativePath,
    text: group.join("\n\n").trim(),
    title,
    url: createChunkUrl(baseUrl, section.anchor),
  }));
};

const createImageDefinitionMap = (
  tree: MarkdownRoot
): Map<string, MarkdownImageDefinition> => {
  const definitions = new Map<string, MarkdownImageDefinition>();

  visit(tree, (node: MarkdownNode) => {
    if (node.type !== "definition") {
      return;
    }

    if (typeof node.identifier !== "string" || typeof node.url !== "string") {
      return;
    }

    definitions.set(node.identifier, {
      title: normalizeOptionalText(node.title),
      url: node.url,
    });
  });

  return definitions;
};

const createImageDescriptionText = (image: MarkdownImageCandidate): string => {
  const parts = [image.alt, image.title].filter(
    (value): value is string => typeof value === "string" && value.length > 0
  );

  return parts
    .filter((part, index) => parts.indexOf(part) === index)
    .join("\n");
};

const getLiteralMdxAttributeValue = (
  node: MarkdownNode,
  attributeName: string
): string | null => {
  const matchingAttribute = node.attributes?.find(
    (attribute) =>
      attribute.type === "mdxJsxAttribute" &&
      attribute.name === attributeName &&
      typeof attribute.value === "string"
  );

  return typeof matchingAttribute?.value === "string"
    ? matchingAttribute.value
    : null;
};

const extractImageCandidateFromNode = ({
  definitions,
  node,
}: {
  definitions: Map<string, MarkdownImageDefinition>;
  node: MarkdownNode;
}): MarkdownImageCandidate | null => {
  if (node.type === "image" && typeof node.url === "string") {
    return {
      alt: normalizeOptionalText(node.alt),
      title: normalizeOptionalText(node.title),
      url: node.url,
    };
  }

  if (node.type === "imageReference" && typeof node.identifier === "string") {
    const definition = definitions.get(node.identifier);

    if (!definition) {
      return null;
    }

    return {
      alt: normalizeOptionalText(node.alt),
      title: definition.title,
      url: definition.url,
    };
  }

  if (
    (node.type === "mdxJsxFlowElement" || node.type === "mdxJsxTextElement") &&
    typeof node.name === "string" &&
    SUPPORTED_MDX_IMAGE_NAMES.has(node.name)
  ) {
    const src = getLiteralMdxAttributeValue(node, "src");

    if (!src) {
      return null;
    }

    return {
      alt: normalizeOptionalText(getLiteralMdxAttributeValue(node, "alt")),
      title: normalizeOptionalText(getLiteralMdxAttributeValue(node, "title")),
      url: src,
    };
  }

  return null;
};

const extractMdxImageText = ({
  definitions,
  node,
}: {
  definitions: Map<string, MarkdownImageDefinition>;
  node: MarkdownNode;
}): string => {
  const imageCandidate = extractImageCandidateFromNode({
    definitions,
    node,
  });

  if (!imageCandidate) {
    return "";
  }

  return createImageDescriptionText(imageCandidate);
};

const visitNestedNodes = (
  node: MarkdownNode,
  visitor: (node: MarkdownNode) => void
): void => {
  visitor(node);

  for (const child of node.children ?? []) {
    visitNestedNodes(child, visitor);
  }
};

const resolveImageIdentity = (
  image: MarkdownImageCandidate
): OpenDetailChunkImage => image;

const extractImagesFromNode = ({
  definitions,
  node,
  resolveImage = resolveImageIdentity,
}: {
  definitions: Map<string, MarkdownImageDefinition>;
  node: MarkdownNode;
  resolveImage?: (image: MarkdownImageCandidate) => OpenDetailChunkImage | null;
}): OpenDetailChunkImage[] => {
  const images: OpenDetailChunkImage[] = [];

  visitNestedNodes(node, (childNode) => {
    const candidate = extractImageCandidateFromNode({
      definitions,
      node: childNode,
    });

    if (!candidate) {
      return;
    }

    const resolvedImage = resolveImage(candidate);

    if (!resolvedImage) {
      return;
    }

    if (images.some((image) => image.url === resolvedImage.url)) {
      return;
    }

    images.push(resolvedImage);
  });

  return images;
};

export const extractMarkdownChunks = ({
  chunkIdPath,
  config,
  fileContent,
  filePath,
  relativePath,
  resolveImage,
}: {
  chunkIdPath?: string;
  config: Pick<OpenDetailConfig, "base_path">;
  fileContent: string;
  filePath: string;
  relativePath: string;
  resolveImage?: (image: MarkdownImageCandidate) => OpenDetailChunkImage | null;
}): OpenDetailChunk[] => {
  const { content, data } = matter(fileContent);
  const tree = parser.parse(content) as MarkdownRoot;
  const imageDefinitions = createImageDefinitionMap(tree);
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
    images: [],
  };

  for (const child of tree.children) {
    const blockText =
      extractBlockText(child) ||
      extractMdxImageText({
        definitions: imageDefinitions,
        node: child,
      });

    if (child.type === "heading") {
      if (
        currentSection.blocks.length > 0 ||
        currentSection.images.length > 0
      ) {
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

      pushUniqueImages(
        nextSection.images,
        extractImagesFromNode({
          definitions: imageDefinitions,
          node: child,
          resolveImage,
        })
      );
      currentSection = nextSection;
      continue;
    }

    if (blockText.length > 0) {
      currentSection.blocks.push(blockText);
    }

    pushUniqueImages(
      currentSection.images,
      extractImagesFromNode({
        definitions: imageDefinitions,
        node: child,
        resolveImage,
      })
    );
  }

  if (currentSection.blocks.length > 0 || currentSection.images.length > 0) {
    sections.push(currentSection);
  }

  if (sections.length === 0) {
    sections.push({
      anchor: null,
      blocks: [title],
      headings: [title],
      images: [],
    });
  }

  const resolvedChunkIdPath = chunkIdPath ?? relativePath;

  return sections.flatMap((section) =>
    splitSectionIntoChunks(
      filePath,
      relativePath,
      resolvedChunkIdPath,
      title,
      baseUrl,
      section
    )
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
