# opendetail registry

This directory is the source of truth for installable UI assets.

## Current scope

- `lib`: shared client placeholders
- `hooks`: shared hook placeholders
- `ui`: primitive assistant placeholders
- `blocks`: composed assistant surface placeholders
- `themes`: base theme placeholders

## Intent

- Keep runtime code in `packages/opendetail`
- Deliver UI as source through a shadcn-compatible registry
- Keep blocks composable through `registryDependencies`
- Avoid real assistant UI behavior until the structure is approved

## Build target

Run the registry build from the repo root:

```sh
bun run registry:build
```

That writes generated JSON payloads into `apps/www/public/r` so the Next app can host docs, demos, and registry output from the same deployment.

`registry/` and `registry.json` stay editable. `apps/www/public/r` is generated output and should not be treated as source.

## Theme import

The `opendetail-base` theme item installs a stylesheet at `styles/opendetail-base.css`.

Import that stylesheet from your app's global CSS entry after install. For a Next app with the default alias setup, `@import "@/styles/opendetail-base.css";` is the intended shape.

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
