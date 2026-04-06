# OpenDetail styles: systems and themes

## Systems (`systems/<id>/`)

A **system** is a full UI identity: layout tokens, component anatomy, density, and the default palette entry for that product line. The shipped **OpenDetail** system lives in `systems/opendetail/index.css`.

Add a new system when you need **different chrome or structure**, not just different colors—e.g. white-label or a separate product line that still uses the same React primitives and headless client.

## Themes (`themes/<systemId>/`)

A **theme** overrides **palette** (and optionally minor radii) **within** one system. Same class names and layout; different paint. OpenDetail themes:

- `themes/opendetail/midnight.css`
- `themes/opendetail/signal.css`

## Import order

1. Base system: `opendetail-base.css` (or `systems/opendetail/index.css`)
2. Optional theme: `opendetail-midnight.css` / `opendetail-signal.css` (or files under `themes/opendetail/`)

The root `opendetail-*.css` files are thin re-exports so existing import paths stay stable.
