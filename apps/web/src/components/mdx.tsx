import type { MDXComponents } from "mdx/types";

/** @deprecated Use `getDocsMdxComponents` for docs routes. */
export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;
