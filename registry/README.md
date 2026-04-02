# opendetail registry

This directory is the packaging layer for installable OpenDetail assets.

## Current scope

- `registry.json`: maps shadcn items to package-owned source files
- generated JSON in `apps/web/public/r`: the published registry payload

## Intent

- Keep runtime and framework code in `packages/`
- Deliver installable source through a shadcn-compatible registry
- Keep blocks composable through `registryDependencies`
- Prefer token-driven style variants over per-theme component forks

## Build target

Run the registry build from the repo root:

```sh
bun run registry:build
```

That writes generated JSON payloads into `apps/web/public/r` so the Next app can host docs, demos, and registry output from the same deployment.

`registry.json` stays editable. `apps/web/public/r` is generated output and should not be treated as source.

## Foundations

The first-class install surface is now package-backed:

- `opendetail-react`: transport, hook, blocks, and styles
- `opendetail-next`: Next.js route and navigation helpers
- `opendetail-fumadocs`: Fumadocs source validation and wrappers

Package-backed registry items should continue to depend on these foundations instead of duplicating transport or theme logic.

## Style import

The `opendetail-base`, `opendetail-midnight`, and `opendetail-signal` registry items now point to the style source in `packages/opendetail-react/src/styles/`.

## Transport example

```ts
import { useOpenDetail } from "opendetail-react";
```

## Future namespace example

Consumers can later map a namespace such as `@opendetail` to the hosted registry URL:

```json
{
  "registries": {
    "@opendetail": "https://your-domain.com/r/{name}.json"
  }
}
```

Prefer HTTPS for the hosted registry URL.
