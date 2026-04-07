---
"opendetail": minor
"opendetail-next": minor
---

Config schema v1 and fetch namespace consolidation.

### opendetail

**Breaking changes:**

- `opendetail.toml` must declare `version = 1`. Per-content URL prefixes are renamed from `base_path` to `public_path` on each `[[content]]` row and on `[media]`.
- OpenAI remote tools now use a single `[fetch]` namespace: `[fetch.file_search]` and `[fetch.web_search]`. The old `[remote]` / `remote.openai` / same-origin `[remote.fetch]` HTML surface is removed — use `fetch` and scope `web_search` with `allowed_domains` instead.
- `createOpenDetail({ remote })` is now `createOpenDetail({ fetch })` to match the TOML shape.
- Index artifacts now include `version: 1` in JSON; rebuild with `opendetail build` after upgrading.
- Optional `knowledge` path in TOML points to a sidecar TOML (e.g. `.opendetail/knowledge.toml`) with `[[asset]]` entries (`url` or `path`, optional `title` / `summary`) merged into chunk images at build time.

### opendetail-next

**Breaking changes:**

- `createNextRouteHandler` / `createNextRoute`: Removed `resolveSiteFetchOrigin`, `OPENDETAIL_SITE_FETCH_ORIGIN`, and `siteFetchOrigin` forwarding. Aligns with the current `opendetail` schema (no runtime same-origin HTML fetch via config).
