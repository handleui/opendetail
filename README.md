# opendetail

Monorepo for `opendetail`, a thin integration layer on top of the OpenAI Responses API for grounded product and documentation answers.

The private hosted dashboard and API live in the sibling [`cloud`](../cloud) monorepo (separate git repository).

## Workspace

- `packages/opendetail`: core runtime, indexing, errors, and setup CLI
- `packages/opendetail-client`: framework-agnostic NDJSON transport client
- `packages/opendetail-react`: hook, components, blocks, and styles
- `packages/opendetail-next`: Next.js route and link integration
- `packages/opendetail-fumadocs`: Fumadocs source validation helpers and wrappers
- `apps/web`: the public Next.js app for marketing, docs, and hosted registry JSON
- `registry/`: thin packaging layer for shadcn-compatible generated assets
- `registry.json`: root registry entrypoint for shadcn CLI builds
- Turborepo remains at the root for `build`, `dev`, `check-types`, and `test`
- Ultracite owns formatting and linting

## Product shape

`opendetail` does not replace the OpenAI Responses API. It packages the parts teams usually still need to build themselves:

- doc indexing from existing Markdown and MDX
- local retrieval and grounding
- setup scaffolding for app integration
- a stable NDJSON transport contract
- first-class client, React, Next, and Fumadocs integrations

The result is a faster path to a narrow, cited assistant without standing up a broader agent platform.

## Adoption Paths

- `Fastest`: `opendetail` + `opendetail-next` + `opendetail-react`
- `Branded`: `opendetail` + `opendetail-next` + `opendetail-client`
- `Headless`: `opendetail`

## Commands

```sh
bun run build
bun run dev
bun run check-types
bun run test
bun run lint
bun run registry:build
```

`packages/` are the source of truth. `registry.json` maps installable registry items to package-owned source files, and `bun run registry:build` generates shadcn registry payloads into `apps/web/public/r`.

## Local Setup

For the site app in `apps/web`, use the app directory as the env source of truth.

```sh
cp apps/web/.env.example apps/web/.env.local
```

Then set `OPENAI_API_KEY` in `apps/web/.env.local` before running `bun run dev`.

## Publish

```sh
bun run changeset
bun run changeset:version
bun run release:check
cd packages/opendetail && npm publish
```

Release notes and version bumps are managed for the publishable packages under
`packages/`. `apps/web` is ignored by Changesets.

Recommended flow:

1. Run `bun run changeset` and describe the change in plain language.
2. Choose the bump type for the packages you changed.
3. Run `bun run changeset:version` to update package manifests and changelogs.
4. Review the diff, commit it, and publish the affected packages manually.

Useful helpers:

- `bun run changeset:status`: inspect pending release entries
- `bun run release:check`: run typecheck, tests, and publint for every publishable package
- `bun run release:pack`: inspect tarballs before publishing
