# Trifold

Three-panel mobile shell: **leading · main · trailing**, with horizontal swipe, flick, and snap. Built for docs shells and assistant layouts; framework-agnostic aside from React and [Motion](https://motion.dev/).

## Install

```bash
npm install trifold motion react react-dom
```

## Usage

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

Tune gestures with optional props: `directionLockPx`, `horizontalDominance`, `flickVelocityPxPerMs`, `snapBoundaryFraction`, and `spring`.

Style with `className` / `*ClassName` props, `--trifold-*` CSS variables on a parent, or `[data-trifold]` / `[data-trifold-panel]` hooks.

## License

MIT
