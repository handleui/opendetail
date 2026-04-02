This app was scaffolded with the official [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app) CLI.

## Role

- Public website for `opendetail`
- Future home for docs and demos
- Future host for generated shadcn registry JSON at `public/r`
- Not the place for shared assistant runtime logic

The backend and adapters stay in `packages/opendetail`. Registry source files live in `registry`.

## Commands

```sh
bun run dev
bun run build
bun run check-types
```

## Local Setup

`apps/web` is the env source of truth for the demo app.

```sh
cp apps/web/.env.example apps/web/.env.local
```

Set `OPENAI_API_KEY` in `apps/web/.env.local` before starting the app.

From the app root (`apps/web`), you can bootstrap OpenDetail files with:

```sh
bunx opendetail setup --with-media
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

That writes generated JSON files into `apps/web/public/r`.
