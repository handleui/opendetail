import type { OpenDetailChunk } from "./types";

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
