# trifold

**Swipe between columns on phones** (and desktop): a small React layout layer on top of [Motion](https://motion.dev/). Each column is full viewport width; users drag horizontally to move between them. Taps can still jump columns with `data-*` attributes.

**Typical use:** nav · main content · optional third column (e.g. tools), without turning your whole app into a carousel library.

## Install

```bash
npm install trifold motion react react-dom
```

Peer dependencies: **React 18+**, **Motion 12+**.

## Minimal `Trifold` (controlled column)

Track which column is visible with React state (`leading` | `center`, or add `trailing` for three columns):

```tsx
"use client";

import { useState } from "react";
import { Trifold, type TrifoldColumn2 } from "trifold";

export function Shell() {
  const [column, setColumn] = useState<TrifoldColumn2>("center");

  return (
    <Trifold
      center={<main>Page</main>}
      column={column}
      leading={<nav>Nav</nav>}
      onColumnChange={setColumn}
    />
  );
}
```

**Declarative jump** (anywhere inside the shell):

```html
<button data-trifold-column="center" type="button">
  Open main
</button>
```

Two columns: omit `trailing`. Three columns: pass `trailing={...}` and use `'leading' | 'center' | 'trailing'` in state.

**Accessibility:** animated settle respects `prefers-reduced-motion`.

## More building blocks

- **ParallelTrack** — N horizontal panels by index (`0`, `1`, …). Declarative jumps: `data-parallel-index="0"` (see export `PARALLEL_INDEX_ATTRIBUTE`).
- **ScrollPanels** — `ParallelTrack` plus per-panel vertical scroll and optional max width.

**Gesture helpers** (for custom UIs): `trackXForDragN`, `panelIndexFromTrackXN`, `clamp`.

## Demo

Reference implementation: Next.js app in **`apps/trifold`** (workspace package **`trifold-demo`**) in the [opendetail](https://github.com/handleui/opendetail) repo.

## License

MIT