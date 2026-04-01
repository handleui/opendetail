# opendetail

Monorepo for the `opendetail` package.

## Workspace

- `packages/opendetail`: MDX-powered documentation assistant package
- Turborepo remains at the root for `build`, `check-types`, and `test`
- Ultracite owns formatting and linting

## Commands

```sh
bun run build
bun run check-types
bun run test
bun run lint
```

## Publish

```sh
cd packages/opendetail
npm publish
```
