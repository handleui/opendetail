# opendetail

Monorepo for `opendetail`, a thin integration layer on top of the OpenAI Responses API for grounded product and documentation answers.

## Workspace

- `packages/opendetail`: core runtime, setup CLI, and thin framework adapters like `opendetail/next`
- `apps/www`: public Next.js site scaffold for docs, demos, and hosted registry JSON
- `registry/`: source of truth for shadcn-compatible transport, hook, style, and UI assets
- `registry.json`: root registry entrypoint for shadcn CLI builds
- Turborepo remains at the root for `build`, `dev`, `check-types`, and `test`
- Ultracite owns formatting and linting

## Product shape

`opendetail` does not replace the OpenAI Responses API. It packages the parts teams usually still need to build themselves:

- doc indexing from existing Markdown and MDX
- local retrieval and grounding
- setup scaffolding for app integration
- a stable NDJSON transport contract
- installable transport, hook, and style foundations

The result is a faster path to a narrow, cited assistant without standing up a broader agent platform.

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
bun run changeset
bun run changeset:version
bun run release:check
cd packages/opendetail && npm publish
```

Release notes and version bumps are now managed only for `packages/opendetail`.
`apps/www` is ignored by Changesets, so the versioning flow stays focused on the
package you publish.

Recommended flow:

1. Run `bun run changeset` and describe the change in plain language.
2. Choose the bump type for `opendetail`.
3. Run `bun run changeset:version` to update `packages/opendetail/package.json`
   and generate or update `packages/opendetail/CHANGELOG.md`.
4. Review the diff, commit it, and publish manually from `packages/opendetail`
   with `npm publish`.

Useful helpers:

- `bun run changeset:status`: inspect pending release entries
- `bun run release:check`: run package-only typecheck, tests, and publint
- `bun run release:pack`: inspect the tarball before publishing
