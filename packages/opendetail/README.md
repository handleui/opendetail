# opendetail

`opendetail` turns your Markdown and MDX docs into a small, grounded assistant for your app.

It builds a local index from your docs, retrieves the most relevant sections for each question, and answers using only that source material.

## Why use it

- Keep answers tied to your own documentation
- Use your existing `.md` and `.mdx` files
- Ship a server-only route without adding a UI package
- Start with one build command and one API route

## Quick start

Install the package:

```bash
npm i opendetail
```

Create `opendetail.toml` in your app root:

```toml
version = 1
include = ["content/**/*.md", "content/**/*.mdx"]
exclude = []
base_path = "/docs"
```

If your docs reference local repo images and your app serves those files at a
public URL, add optional media mapping:

```toml
[media]
include = ["content/**/*.{png,jpg,jpeg,webp,avif,gif,svg}"]
exclude = []
base_path = "/content-media"
```

Build the index:

```bash
npx opendetail build
```

This writes `.opendetail/index.json`.

## Next.js

Add a Route Handler and keep it on the Node runtime:

```ts
import { createNextRouteHandler } from "opendetail/next";

export const runtime = "nodejs";
export const POST = createNextRouteHandler();
```

Send a request like this:

```json
{ "question": "How do I install this?" }
```

The route streams NDJSON events:

- `meta`
- `sources`
- `images`
- `delta`
- `done`
- `error`

Before starting your app, set `OPENAI_API_KEY` in the app runtime environment.
If setup fails before streaming starts, the Next.js adapter returns JSON shaped
like `{ error, code, retryable }`.

When a stream fails after it starts, the `error` event includes:

- `message`
- `code`
- `retryable`

## Core API

If you want to use the runtime directly:

```ts
import { createOpenDetail } from "opendetail";

const assistant = createOpenDetail();

const result = await assistant.answer({
  question: "How do I configure base_path?",
});
```

To provide persistent behavior guidance for the assistant, add `OPENDETAIL.md`
in one of these locations:

1. `.opendetail/OPENDETAIL.md` (preferred)
2. `OPENDETAIL.md` at the project root (fallback)

You can also pass `assistantInstructions` or `assistantInstructionsPath` to
`createOpenDetail` for explicit control.

The result includes grounded image metadata in `result.images` when the matched
docs contain supported image references. `image.sourceIds` map back to the
entries in `result.sources`.

Supported image references:

- `http://` and `https://` URLs are returned as-is
- root-relative `/...` URLs are returned as-is
- local relative paths such as `./hero.png` are returned only when `[media]` is configured
- unsupported absolute schemes and protocol-relative URLs are ignored

The runtime returns at most 3 images per answer or stream.

## CLI

The package ships with its own CLI. The main command is:

```bash
npx opendetail build
```

That is standard npm package behavior. When installed locally, the same binary is also available through your package manager.

## How it works

`opendetail` follows a simple build-time and request-time flow.

### 1. Build time

- Read the files matched by `opendetail.toml`
- Optionally map referenced local media files to public URLs
- Parse Markdown and MDX content
- Split content by heading sections
- Create a local JSON index at `.opendetail/index.json`

### 2. Request time

- Load the local index into memory
- Search it with lexical matching
- Select the most relevant chunks
- Send only those chunks to the model
- Return an answer with citations

This keeps the runtime simple and avoids external search infrastructure in the MVP.

## Default runtime settings

- model: `gpt-5.4-mini`
- reasoning: `none`
- verbosity: `low`
- prompt cache retention: `in-memory` (Responses API prompt caching enabled)

## Requirements

- Node.js 18 or newer
- `OPENAI_API_KEY` set at runtime
- Node runtime for Next.js route handlers

## Publishing

The package is set up so `npm publish` builds the distributable automatically through `prepack` and runs package checks through `prepublishOnly`.
