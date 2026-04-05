# Trifold

Sideways panel navigation for React: swipe, flick, snap, and programmatic jumps. Ships **`SlideRow`** (any number of full-viewport panels) and **`Trifold`** (opinionated three-slot layout for nav · main · assistant). Depends on [Motion](https://motion.dev/).

**Moat:** horizontal transitions and gesture math — not a prescribed app shape. Nest `SlideRow` inside a panel for master–detail stacks, split views, or future desktop layouts.

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

// Anywhere inside the row: declarative jump (default attribute `data-slide-to`)
<button data-slide-to="0" type="button">
  Back
</button>
```

Optional: `ref` with `{ goTo(index) }`, `dragEnabled`, `slideToClickEnabled`, `onPanelClickCapture`, `panelClassName`, and the same gesture props as below.

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

Tune gestures: `directionLockPx`, `horizontalDominance`, `flickVelocityPxPerMs`, `snapBoundaryFraction`, `spring`.

Style with `className` / `*ClassName` props, `--trifold-*` CSS variables, or `[data-trifold]` / `[data-trifold-main]`.

### Low-level helpers

`trackXForDragN`, `panelIndexFromTrackXN`, and `clamp` are exported for tests or custom UIs.

## License

MIT
