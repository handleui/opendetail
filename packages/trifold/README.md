# trifold

**Phone-first column shell for React:** native horizontal scrolling + CSS scroll-snap between full-width columns (nav · main · optional third). No animation-library requirement—peer dependency is **React** only. Each column should use its **own** vertical scroll (`min-h-0` + `overflow-y-auto` on an inner wrapper), not the window.

**Typical use:** same pattern as many mobile apps and responsive sites—swipe left/right between columns, scroll up/down inside the column you’re on.

## Install

```bash
npm install trifold react react-dom
```

Peer dependencies: **React 18+**.

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

**`touchSwipeBetweenColumns`** (default `true`): set `false` to disable horizontal swiping between columns (e.g. kiosk or embed); use `data-trifold-column` / buttons / `ParallelTrack`’s `goTo()` instead.

**Accessibility:** programmatic column changes use smooth horizontal scrolling unless `prefers-reduced-motion` is set.

## More building blocks

- **ParallelTrack** — N horizontal panels by index (`0`, `1`, …). Declarative jumps: `data-parallel-index="0"` (see export `PARALLEL_INDEX_ATTRIBUTE`).
- **ScrollPanels** — `ParallelTrack` plus per-panel vertical scroll and optional max width.

**Gesture helpers** (for custom UIs): `trackXForDragN`, `panelIndexFromTrackXN`, `clamp`.

## Demo

Reference implementation: Next.js app in **`apps/trifold`** (workspace package **`trifold-demo`**) in the [opendetail](https://github.com/handleui/opendetail) repo.

## License

MIT
