# Trifold

Sideways panel navigation for React: **`SlideRow`** (any number of panels) and **`Trifold`** (nav · main · assistant). Depends on [Motion](https://motion.dev/). **Default interaction:** touch horizontal pan on phones/tablets; **taps and clicks** (`data-slide-to`, links, `goTo`) on all viewports — opt in to mouse drag or horizontal wheel separately.

**Moat:** horizontal transitions and gesture math — not a prescribed app shape. Nest `SlideRow` inside a panel for master–detail stacks or more rows.

### `StackedPanels` (recommended shell)

Same gestures as `SlideRow`, plus **bounded** panels: each surface gets `min-h-0`, vertical scroll, optional **max-width** centering (`contentMaxWidthClassName`), and **`density`**: `compact` (thin sidebars) vs `comfortable` (full-page gutters). Aligns with how **`Trifold`** composes `SlideRow` in product shells (e.g. mobile triptych in OpenDetail). Add **N** panels for longer flows; at **split** breakpoints you always see the **active** column and the **next** column (`activeIndex` + `activeIndex + 1`). For a **second horizontal story** inside one column, nest **`SlideRow`** (or another `StackedPanels`) in that panel.

```tsx
import { StackedPanels } from "trifold";

<StackedPanels
  activeIndex={index}
  contentMaxWidthClassName="max-w-[1080px]"
  density="comfortable"
  onActiveIndexChange={setIndex}
  panels={[<PageA key="a" />, <PageB key="b" />]}
/>;
```

## Install

```bash
npm install trifold motion react react-dom
```

## SlideRow (generic)

```tsx
import { SlideRow } from "trifold";

<SlideRow activeIndex={index} onActiveIndexChange={setIndex}>
  <section>First</section>
  <section>Second</section>
</SlideRow>

// Declarative jump (default attribute `data-slide-to`)
<button data-slide-to="0" type="button">
  Back
</button>
```

### Controls (API surface)

| Prop | Purpose |
|------|---------|
| `settleTransitionEnabled` | When `false`, index changes jump with **no** spring (duration 0). Dragging still tracks the pointer. |
| `dragEnabled` | When `false`, disables pointer drag **and** horizontal wheel navigation; `data-slide-to` / `goTo` / links still work. |
| `finePointerDragEnabled` | Primary-button drag (mouse / pen / trackpad). Default **`false`** — **touch** horizontal pan on phones/tablets; **desktop** uses taps/clicks (`data-slide-to`, links, `goTo`). Set `true` for click-drag on desktop. |
| `wheelHorizontalEnabled` | Optional horizontal **wheel** / trackpad panning. Default **`false`** — standard navigation is taps/clicks on all viewports; opt in for trackpad-heavy layouts. |
| `wheelHorizontalThresholdPx` | When wheel is enabled: accumulate `deltaX` until **±**this value to commit a step (default **100**). |
| `dragActivationMarginsPx` | e.g. `{ left: 32, right: 32 }` — pointer drag only starts near those panel edges (omit for full-panel drag). Applies to touch too when set. |
| `dragRevealDeadZonePx` | After horizontal drag locks, ignore the first N px of movement for **track offset** (carousel “reveal” starts after this). Default **0**. |
| `dragCommitThresholdPx` | On pointer **release**, if horizontal movement (screen px) ≥ this, **commit** to next/prev in that direction (before flick/snap). Omit for flick + position snap only. Typical **48–120**. |
| `gestureInput` | `auto` (use pointer type), `touch`, or `fine` — picks touch vs mouse/trackpad tuning for **drag** physics. |
| `directionLockPxTouch` / `directionLockPxFine` | Axis lock distance (defaults 6 / 10). |
| `flickVelocityPxPerMsTouch` / `…Fine` | Flick thresholds (defaults 0.32 / 0.22). |
| `horizontalDominanceTouch` / `…Fine` | Horizontal vs vertical (defaults 1.08 / 1.18). |
| `directionLockPx`, `flickVelocityPxPerMs`, `horizontalDominance` | Legacy single value: used for **both** kinds when the per-kind override is omitted. |
| `spring` | Partial spring `{ stiffness, damping, mass }` for Motion settle (defaults are fairly snappy). |
| `horizontalDeltaSign` | `1` or `-1` — multiply drag, wheel `deltaX`, and flick velocity (default **1**). Set **`-1`** if sliding one way moves content the other way. |
| `splitLayout` | `false` or `{ minWidthPx?: 1024 }` — from that breakpoint up, **two** columns (50% / 50%) with adjacent panels; uses `data-slide-row-split`. |
| `splitPointerNavigation` | When split is active, **wheel + pointer drag are off** unless this is **`true`** (navigation via actions / `data-slide-to` / `goTo` / links). Default: off while split. |
| `slideToClickEnabled`, `slideToAttribute` | Declarative `data-slide-to` jumps. |
| `ref` | `{ goTo(index) }` imperative navigation. |

Respects `prefers-reduced-motion` (no animated settle).

## Trifold (nav · main · assistant)

```tsx
import { Trifold } from "trifold";

<Trifold
  leading={<YourNav />}
  main={<YourPage />}
  trailing={<YourAssistant />}
  panelIndex={index}
  onPanelIndexChange={setIndex}
/>;
```

Tune gestures with the same baseline props as above on **`SlideRow`** if you use it directly; `Trifold` composes `SlideRow` internally.

### Low-level helpers

`trackXForDragN`, `panelIndexFromTrackXN`, and `clamp` use a **step width in px** (full viewport or half in split mode).

## License

MIT
