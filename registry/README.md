# opendetail registry

This directory is the source of truth for installable OpenDetail assets.

## Current scope

- `lib`: transport foundations such as the canonical NDJSON client
- `hooks`: React foundations built on top of the transport layer
- `ui`: primitive assistant components
- `blocks`: composed assistant surfaces
- `themes`: style source files and token overrides used by registry style items

## Intent

- Keep runtime code in `packages/opendetail`
- Deliver installable source through a shadcn-compatible registry
- Keep transport, hooks, and styles as first-class foundations
- Keep blocks composable through `registryDependencies`
- Prefer token-driven style variants over per-theme component forks

## Build target

Run the registry build from the repo root:

```sh
bun run registry:build
```

That writes generated JSON payloads into `apps/web/public/r` so the Next app can host docs, demos, and registry output from the same deployment.

`registry/` and `registry.json` stay editable. `apps/web/public/r` is generated output and should not be treated as source.

## Foundations

The first-class install surface is:

- `opendetail-client`: the transport contract for self-hosted and hosted endpoints
- `use-opendetail`: the React hook that manages request and stream state
- `opendetail-base`: the base style contract for tokens and semantic classes
- app-shell blocks such as `assistant-sidebar-shell`
- style variants such as `opendetail-midnight` and `opendetail-signal`

`opendetail-client` and `use-opendetail` should stay aligned around the same transport options: `endpoint`, `headers`, `credentials`, and an overridable `fetch` implementation.

Component wrappers should continue to depend on these foundations instead of duplicating transport or theme logic.

For hosted integrations, applications are expected to read env like `OPENDETAIL_ENDPOINT` themselves and pass it into `createOpenDetailClient` or `useOpenDetail({ transport: ... })`. The registry foundations do not read app env automatically.

## Style import

The `opendetail-base` style item installs a stylesheet at `styles/opendetail-base.css`.

Import that stylesheet from your app's global CSS entry after install. For a Next app with the default alias setup, `@import "@/styles/opendetail-base.css";` is the intended shape.

Optional variants such as `opendetail-midnight` or `opendetail-signal` should be imported after the base stylesheet so they can override the shared token contract without changing component code.

The current style source files still live under `registry/themes/`, but the registry metadata now treats them as installable style items.

The base stylesheet now includes the inline response loader and error styles, so consumers do not need an extra shimmer dependency for the default assistant state UI.

## Transport example

```ts
const assistant = useOpenDetail({
  transport: {
    endpoint: process.env.NEXT_PUBLIC_OPENDETAIL_ENDPOINT,
    headers: () => {
      const token = process.env.NEXT_PUBLIC_OPENDETAIL_AUTH_TOKEN;

      return token ? { authorization: `Bearer ${token}` } : {};
    },
  },
});
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
