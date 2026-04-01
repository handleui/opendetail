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
- `delta`
- `done`
- `error`

## Core API

If you want to use the runtime directly:

```ts
import { createOpenDetail } from "opendetail";

const assistant = createOpenDetail();

const result = await assistant.answer({
  question: "How do I configure base_path?",
});
```

## CLI

The package ships with its own CLI. The main command in `0.1.0` is:

```bash
npx opendetail build
```

That is standard npm package behavior. When installed locally, the same binary is also available through your package manager.

## How it works

`opendetail` follows a simple build-time and request-time flow.

### 1. Build time

- Read the files matched by `opendetail.toml`
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

## Requirements

- Node.js 18 or newer
- `OPENAI_API_KEY` set at runtime
- Node runtime for Next.js route handlers

## Publishing

The package is set up so `npm publish` builds the distributable automatically through `prepack` and runs package checks through `prepublishOnly`.
