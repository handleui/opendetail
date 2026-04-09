This is the single public app for `opendetail`.

## Role

- Marketing site at `/`
- Documentation site at `/docs`
- Host for generated shadcn registry JSON at `public/r`
- Not the place for shared assistant runtime logic

The backend and DX packages live under `packages/`, especially `packages/opendetail`, `packages/opendetail-next`, and `packages/opendetail-client`. Registry source files live in `registry`.

## Commands

```sh
bun run dev
bun run build
bun run check-types
```

## Local Setup

`apps/web` is the env source of truth for the public site.

```sh
cp apps/web/.env.example apps/web/.env.local
```

Set `OPENAI_API_KEY` in `apps/web/.env.local` before starting the app.

From the app root (`apps/web`), you can bootstrap OpenDetail files with:

```sh
bunx opendetail setup --mode fastest --with-media
```

`bun run dev` runs the app through `openlogs` and `portless` on proxy port `443`.

```sh
bun run dev
```

That serves the site at `http://opendetail.localhost:443`.

To build the registry payload that this app will eventually serve:

```sh
bun run registry:build
```

That writes generated JSON files into `apps/web/public/r` from package-owned source mapped through `registry.json`.
