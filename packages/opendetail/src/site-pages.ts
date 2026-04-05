import { createHash } from "node:crypto";
import type { OpenDetailChunk, OpenDetailSitePagesFetchConfig } from "./types";

const DEFAULT_MAX_FETCH_BYTES = 500_000;
const FETCH_CACHE_MAX_ENTRIES = 64;

const SCRIPT_STYLE_REGEX =
  /<script\b[^>]*>[\s\S]*?<\/script>|<style\b[^>]*>[\s\S]*?<\/style>/giu;
const TAG_REGEX = /<[^>]+>/gu;
const HTML_TITLE_REGEX = /<title[^>]*>([\s\S]*?)<\/title>/iu;
const HTML_ENTITY_MAP: Record<string, string> = {
  amp: "&",
  apos: "'",
  gt: ">",
  lt: "<",
  nbsp: " ",
  quot: '"',
};

const fetchTextCache = new Map<string, { text: string; title: string }>();
let fetchCacheOrder: string[] = [];

const touchFetchCache = (key: string): void => {
  fetchCacheOrder = fetchCacheOrder.filter((entry) => entry !== key);
  fetchCacheOrder.push(key);

  while (fetchCacheOrder.length > FETCH_CACHE_MAX_ENTRIES) {
    const oldest = fetchCacheOrder.shift();

    if (oldest) {
      fetchTextCache.delete(oldest);
    }
  }
};

export const getUrlPathname = (url: string): string => {
  if (url.startsWith("/")) {
    const hashIndex = url.indexOf("#");

    return hashIndex === -1 ? url : url.slice(0, hashIndex);
  }

  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
};

export const pathMatchesSitePrefix = (
  pathname: string,
  prefix: string
): boolean => {
  const normalizedPrefix =
    prefix.length > 1 && prefix.endsWith("/") ? prefix.slice(0, -1) : prefix;

  if (normalizedPrefix === "/") {
    return pathname === "/" || pathname === "";
  }

  return (
    pathname === normalizedPrefix || pathname.startsWith(`${normalizedPrefix}/`)
  );
};

/** For fetch allowlists, `/` means any path on the site. */
export const pathMatchesAllowedFetchPrefix = (
  pathname: string,
  prefix: string
): boolean => {
  const normalizedPrefix =
    prefix.length > 1 && prefix.endsWith("/") ? prefix.slice(0, -1) : prefix;

  if (normalizedPrefix === "/") {
    return pathname.startsWith("/");
  }

  return (
    pathname === normalizedPrefix || pathname.startsWith(`${normalizedPrefix}/`)
  );
};

export const normalizeSitePathInput = (raw: string): string | null => {
  const trimmed = raw.trim();

  if (trimmed.length === 0 || trimmed.length > 512) {
    return null;
  }

  let pathname = trimmed;

  if (!pathname.startsWith("/")) {
    pathname = `/${pathname}`;
  }

  try {
    pathname = decodeURIComponent(pathname);
  } catch {
    return null;
  }

  if (pathname.includes("..") || pathname.includes("\0")) {
    return null;
  }

  return pathname;
};

export const isPathAllowedForFetch = (
  pathname: string,
  config: OpenDetailSitePagesFetchConfig
): boolean =>
  config.allowed_path_prefixes.some((prefix) => {
    const normalized = normalizeSitePathInput(prefix);

    return (
      normalized !== null && pathMatchesAllowedFetchPrefix(pathname, normalized)
    );
  });

export const filterChunkIdsBySitePaths = (
  chunks: OpenDetailChunk[],
  sitePaths: string[]
): Set<string> => {
  const normalizedPrefixes = sitePaths
    .map((path) => normalizeSitePathInput(path))
    .filter((path): path is string => path !== null);

  if (normalizedPrefixes.length === 0) {
    return new Set();
  }

  const ids = new Set<string>();

  for (const chunk of chunks) {
    const pathname = getUrlPathname(chunk.url);

    if (
      normalizedPrefixes.some((prefix) =>
        pathMatchesSitePrefix(pathname, prefix)
      )
    ) {
      ids.add(chunk.id);
    }
  }

  return ids;
};

export const decodeBasicHtmlEntities = (input: string): string =>
  input.replaceAll(/&(#\d+|#x[\dA-Fa-f]+|\w+);/gu, (entity) => {
    if (entity.startsWith("&#x") || entity.startsWith("&#X")) {
      const code = Number.parseInt(entity.slice(3, -1), 16);

      return Number.isFinite(code) ? String.fromCodePoint(code) : entity;
    }

    if (entity.startsWith("&#")) {
      const code = Number.parseInt(entity.slice(2, -1), 10);

      return Number.isFinite(code) ? String.fromCodePoint(code) : entity;
    }

    const name = entity.slice(1, -1);

    return HTML_ENTITY_MAP[name] ?? entity;
  });

export const stripHtmlToText = (
  html: string
): { text: string; title: string } => {
  let title = "";
  const titleMatch = HTML_TITLE_REGEX.exec(html);

  if (titleMatch?.[1]) {
    title = decodeBasicHtmlEntities(
      titleMatch[1].replace(TAG_REGEX, " ").replace(/\s+/gu, " ").trim()
    );
  }

  const withoutScripts = html.replace(SCRIPT_STYLE_REGEX, " ");
  const withoutTags = withoutScripts.replace(TAG_REGEX, " ");
  const text = decodeBasicHtmlEntities(
    withoutTags.replace(/\s+/gu, " ").trim()
  );

  return { text, title };
};

const resolveFetchMaxBytes = (
  config: OpenDetailSitePagesFetchConfig | undefined
): number => config?.max_bytes ?? DEFAULT_MAX_FETCH_BYTES;

export const buildSameOriginPageUrl = (
  origin: string,
  pathname: string
): string => {
  const base = new URL(origin);

  if (base.protocol !== "http:" && base.protocol !== "https:") {
    throw new Error("siteFetchOrigin must use http or https.");
  }

  return new URL(pathname, base).href;
};

export const fetchSitePageText = async ({
  abortSignal,
  fetchConfig,
  origin,
  pathname,
}: {
  abortSignal?: AbortSignal;
  fetchConfig: OpenDetailSitePagesFetchConfig;
  origin: string;
  pathname: string;
}): Promise<{ text: string; title: string }> => {
  const normalizedPath = normalizeSitePathInput(pathname);

  if (
    normalizedPath === null ||
    !isPathAllowedForFetch(normalizedPath, fetchConfig)
  ) {
    throw new Error(`Path is not allowed for site page fetch: ${pathname}`);
  }

  const cacheKey = `${origin}::${normalizedPath}`;
  const cached = fetchTextCache.get(cacheKey);

  if (cached) {
    touchFetchCache(cacheKey);

    return cached;
  }

  const url = buildSameOriginPageUrl(origin, normalizedPath);
  const maxBytes = resolveFetchMaxBytes(fetchConfig);
  const response = await fetch(url, {
    headers: {
      accept: "text/html,application/xhtml+xml",
    },
    redirect: "error",
    signal: abortSignal,
  });

  if (!response.ok) {
    throw new Error(`Fetch failed with status ${response.status} for ${url}`);
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (
    !(
      contentType.includes("text/html") ||
      contentType.includes("application/xhtml")
    )
  ) {
    throw new Error(
      `Unsupported content type for site page fetch: ${contentType}`
    );
  }

  const buffer = await response.arrayBuffer();

  if (buffer.byteLength > maxBytes) {
    throw new Error(`Page response exceeded max_bytes (${maxBytes}).`);
  }

  const decoder = new TextDecoder("utf8", { fatal: false });
  const html = decoder.decode(buffer);
  const extracted = stripHtmlToText(html);
  fetchTextCache.set(cacheKey, extracted);
  touchFetchCache(cacheKey);

  return extracted;
};

export const createFetchedPageChunk = ({
  pathname,
  origin,
  text,
  title,
}: {
  origin: string;
  pathname: string;
  text: string;
  title: string;
}): OpenDetailChunk => {
  const normalizedPath = normalizeSitePathInput(pathname) ?? pathname;
  const pageUrl = buildSameOriginPageUrl(origin, normalizedPath);
  const idInput = `fetch:${pageUrl}`;
  const id = createHash("sha256").update(idInput).digest("hex").slice(0, 24);

  return {
    anchor: null,
    filePath: `site-fetch:${normalizedPath}`,
    headings: [],
    id,
    images: [],
    relativePath: normalizedPath,
    sourceKind: "page",
    text,
    title: title.length > 0 ? title : normalizedPath,
    url: pageUrl,
  };
};

const chunkCoversSitePath = (
  chunk: OpenDetailChunk,
  sitePath: string
): boolean => {
  const pathname = getUrlPathname(chunk.url);
  const target = normalizeSitePathInput(sitePath) ?? sitePath;

  return pathMatchesSitePrefix(pathname, target);
};

export const listPathsNeedingFetch = ({
  chunks,
  fetchConfig,
  origin,
  sitePaths,
}: {
  chunks: OpenDetailChunk[];
  fetchConfig: OpenDetailSitePagesFetchConfig;
  origin: string;
  sitePaths: string[];
}): string[] => {
  if (!origin || sitePaths.length === 0) {
    return [];
  }

  const normalizedSitePaths = sitePaths
    .map((path) => normalizeSitePathInput(path))
    .filter((path): path is string => path !== null)
    .filter((path) => isPathAllowedForFetch(path, fetchConfig));

  return normalizedSitePaths.filter(
    (path) => !chunks.some((chunk) => chunkCoversSitePath(chunk, path))
  );
};
