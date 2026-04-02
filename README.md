# opendetail

Monorepo for the `opendetail` runtime and future UI distribution surface.

## Workspace

- `packages/opendetail`: core runtime, CLI, and thin framework adapters like `opendetail/next`
- `apps/www`: public Next.js site scaffold for future docs, demos, and hosted registry JSON
- `registry/`: source of truth for shadcn-compatible UI assets and placeholders
- `registry.json`: root registry entrypoint for shadcn CLI builds
- Turborepo remains at the root for `build`, `dev`, `check-types`, and `test`
- Ultracite owns formatting and linting

## Commands

```sh
bun run build
bun run dev
bun run check-types
bun run test
bun run lint
bun run registry:build
```

`registry/` and `registry.json` are the source of truth. `bun run registry:build` generates shadcn registry payloads into `apps/www/public/r`, and that output should be treated as generated build output rather than hand-edited source.

## Local Setup

For the demo app in `apps/www`, use the app directory as the env source of truth.

```sh
cp apps/www/.env.example apps/www/.env.local
```

Then set `OPENAI_API_KEY` in `apps/www/.env.local` before running `bun run dev`.

## Publish

```sh
cd packages/opendetail
npm publish --dry-run
npm publish
```
