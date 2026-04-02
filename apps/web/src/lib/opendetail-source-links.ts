export interface OpenDetailSourceLike {
  kind?: "local" | "remote";
  url: string;
}

export interface OpenDetailSourceTarget {
  external?: boolean;
  href: string;
}

const TRAILING_SLASHES_REGEX = /\/+$/u;

const normalizePathname = (value: string): string => {
  if (value === "/") {
    return value;
  }

  return value.replace(TRAILING_SLASHES_REGEX, "");
};

const splitHash = (
  value: string
): {
  hash: string;
  pathname: string;
} => {
  const [pathname, ...hashParts] = value.split("#");

  return {
    hash: hashParts.length > 0 ? `#${hashParts.join("#")}` : "",
    pathname: pathname ?? value,
  };
};

const normalizeKnownPageUrls = (
  knownPageUrls: readonly string[]
): Set<string> =>
  new Set(
    knownPageUrls.map((pageUrl) =>
      normalizePathname(splitHash(pageUrl).pathname)
    )
  );

const resolveKnownLocalSourceTarget = ({
  knownPagePathnames,
  source,
}: {
  knownPagePathnames: ReadonlySet<string>;
  source: OpenDetailSourceLike;
}): OpenDetailSourceTarget | null => {
  if (!source.url.startsWith("/")) {
    return null;
  }

  const { hash, pathname } = splitHash(source.url);
  const normalizedPathname = normalizePathname(pathname);

  if (!knownPagePathnames.has(normalizedPathname)) {
    return null;
  }

  return {
    external: false,
    href: `${normalizedPathname}${hash}`,
  };
};

export const resolveFumadocsSourceTarget = ({
  knownPageUrls,
  source,
}: {
  knownPageUrls: readonly string[];
  source: OpenDetailSourceLike;
}): OpenDetailSourceTarget | null => {
  if (source.kind === "remote") {
    try {
      const parsedUrl = new URL(source.url);

      if (parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:") {
        return {
          external: true,
          href: source.url,
        };
      }

      return null;
    } catch {
      return null;
    }
  }

  return resolveKnownLocalSourceTarget({
    knownPagePathnames: normalizeKnownPageUrls(knownPageUrls),
    source,
  });
};

export const createFumadocsSourceTargetResolver = (
  knownPageUrls: readonly string[]
) => {
  const knownPagePathnames = normalizeKnownPageUrls(knownPageUrls);

  return (source: OpenDetailSourceLike): OpenDetailSourceTarget | null =>
    source.kind === "remote"
      ? resolveFumadocsSourceTarget({
          knownPageUrls,
          source,
        })
      : resolveKnownLocalSourceTarget({
          knownPagePathnames,
          source,
        });
};
