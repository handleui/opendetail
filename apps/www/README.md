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

To build the registry payload that this app will eventually serve:

```sh
bun run registry:build
```

That writes generated JSON files into `apps/www/public/r`.
