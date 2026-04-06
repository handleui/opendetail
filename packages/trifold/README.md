# Trifold

Phone-first **parallel columns** for React (DOM) with [Motion](https://motion.dev/): swipe between full-width columns; taps still move the track via declarative attributes and `ref.goTo`.

**Primitives**

- **`Trifold`** — two or three **positional** columns: `leading` · `center` · optional `trailing`. State is **`column: 'leading' | 'center' | 'trailing'`** (or the two-column subset). Roles (nav, article, tools, etc.) are **your** mapping — the API stays geometric.
- **`ParallelTrack`** — **N** panels, 0-based **`activeIndex`**. Use for wizards, 4+ steps, or nested horizontal stacks. Declarative jumps: **`data-parallel-index="0"`** … (export **`PARALLEL_INDEX_ATTRIBUTE`**).
- **`ScrollPanels`** — `ParallelTrack` plus per-panel vertical scroll, optional max-width, and density.

**Interaction:** horizontal **touch** drag on the track; **`prefers-reduced-motion`** disables animated settle.

**React Native:** not in this package — same column idea can be mirrored with Reanimated / gesture-handler later.

### Mapping columns to your app

Example: `leading` = site nav, `center` = page, `trailing` = assistant. Those names live in **your** copy and layout; `Trifold` only knows **order** in the horizontal track.

## Install

```bash
npm install trifold motion react react-dom
```

## `Trifold` (2 or 3 columns)

```tsx
import { Trifold } from "trifold";

<Trifold
  center={<Page />}
  column={column}
  leading={<Nav />}
  onColumnChange={setColumn}
  trailing={<Tools />}
/>;
```

Declarative jump inside the shell:

```html
<button data-trifold-column="center" type="button">Main</button>
```

Two columns: omit **`trailing`**; **`column`** is **`'leading' | 'center'`**.

## `ParallelTrack` (indexed strip)

```tsx
import { ParallelTrack } from "trifold";

<ParallelTrack activeIndex={index} onActiveIndexChange={setIndex}>
  <section>First</section>
  <section>Second</section>
</ParallelTrack>

<button data-parallel-index="0" type="button">
  Back
</button>
```

## `ScrollPanels` (routed stacks)

Same as **`ParallelTrack`**, with **`panels={[...]}`**, **`contentMaxWidthClassName`**, **`density`**. Demo app: **`apps/trifold`**.

## Low-level helpers

`trackXForDragN`, `panelIndexFromTrackXN`, and `clamp` take **step width in px** (full viewport width per column).

## License

MIT
