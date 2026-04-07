"use client";

import { animate, motion, type PanInfo, useMotionValue } from "motion/react";
import {
  Children,
  forwardRef,
  type MouseEvent,
  type MutableRefObject,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import {
  PARALLEL_INDEX_ATTRIBUTE,
  type ParallelTrackHandle,
  type ParallelTrackProps,
} from "./parallel-track-types.js";
import { panelIndexFromSwipeIntent } from "./gesture-math.js";

function defaultParseJumpIndex(raw: string): number | null {
  const next = Number.parseInt(raw, 10);
  if (!Number.isFinite(next)) {
    return null;
  }
  return next;
}

const prefersReducedMotionQuery = "(prefers-reduced-motion: reduce)";
const DEFAULT_SWIPE_DISTANCE_THRESHOLD_PX = 56;
const DEFAULT_SWIPE_VELOCITY_THRESHOLD_PX_PER_SEC = 520;

function subscribeReducedMotion(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {
      /* SSR */
    };
  }

  const mq = window.matchMedia(prefersReducedMotionQuery);
  mq.addEventListener("change", onStoreChange);
  return () => mq.removeEventListener("change", onStoreChange);
}

function getReducedMotionSnapshot(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return window.matchMedia(prefersReducedMotionQuery).matches;
}

function getReducedMotionServerSnapshot(): boolean {
  return false;
}

function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function toTargetX(panelIndex: number, panelWidth: number): number {
  return -panelIndex * panelWidth;
}

function stopAnimation(
  animationRef: MutableRefObject<ReturnType<typeof animate> | null>
): void {
  animationRef.current?.stop();
  animationRef.current = null;
}

function settleToIndex({
  animationRef,
  index,
  immediate,
  panelWidth,
  prefersReducedMotion,
  settleTransitionEnabled,
  x,
}: {
  animationRef: MutableRefObject<ReturnType<typeof animate> | null>;
  index: number;
  immediate: boolean;
  panelWidth: number;
  prefersReducedMotion: boolean;
  settleTransitionEnabled: boolean;
  x: ReturnType<typeof useMotionValue<number>>;
}): void {
  if (panelWidth <= 0) {
    return;
  }

  const target = toTargetX(index, panelWidth);
  stopAnimation(animationRef);

  if (immediate || !settleTransitionEnabled || prefersReducedMotion) {
    x.set(target);
    return;
  }

  animationRef.current = animate(x, target, {
    damping: 42,
    mass: 0.9,
    stiffness: 460,
    type: "spring",
  });
}

export const ParallelTrack = forwardRef<
  ParallelTrackHandle,
  ParallelTrackProps
>(function ParallelTrack(
  {
    activeIndex,
    children,
    className,
    dragEnabled = true,
    jumpAttribute = PARALLEL_INDEX_ATTRIBUTE,
    jumpClickEnabled = true,
    onActiveIndexChange,
    onPanelClickCapture,
    panelClassName,
    parseJumpIndex = defaultParseJumpIndex,
    settleTransitionEnabled = true,
    swipeDistanceThresholdPx = DEFAULT_SWIPE_DISTANCE_THRESHOLD_PX,
    swipeVelocityThresholdPxPerSec = DEFAULT_SWIPE_VELOCITY_THRESHOLD_PX_PER_SEC,
    trackClassName,
  },
  ref
) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const panels = Children.toArray(children);
  const panelCount = panels.length;
  const safeCount = Math.max(1, panelCount);
  const safeIndex = Math.min(Math.max(0, activeIndex), safeCount - 1);

  const rootRef = useRef<HTMLDivElement>(null);
  const didInitialPositionRef = useRef(false);
  const animationRef = useRef<ReturnType<typeof animate> | null>(null);
  const panelWidthRef = useRef(0);
  const [panelWidthVersion, setPanelWidthVersion] = useState(0);
  const x = useMotionValue(0);

  const setPanelWidth = (nextWidth: number) => {
    if (nextWidth === panelWidthRef.current) {
      return;
    }

    panelWidthRef.current = nextWidth;
    setPanelWidthVersion((version) => version + 1);
  };

  useLayoutEffect(() => {
    const rootEl = rootRef.current;
    if (!rootEl) {
      return;
    }

    const updateWidth = () => {
      const width = rootEl.clientWidth;
      if (width <= 0) {
        return;
      }
      setPanelWidth(width);
    };

    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(rootEl);
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    settleToIndex({
      animationRef,
      immediate: !didInitialPositionRef.current,
      index: safeIndex,
      panelWidth: panelWidthRef.current,
      prefersReducedMotion,
      settleTransitionEnabled,
      x,
    });
    didInitialPositionRef.current = true;
  }, [panelWidthVersion, prefersReducedMotion, safeIndex, settleTransitionEnabled, x]);

  useEffect(
    () => () => {
      stopAnimation(animationRef);
    },
    []
  );

  useImperativeHandle(
    ref,
    () => ({
      goTo: (index: number) => {
        const clamped = clamp(index, 0, safeCount - 1);
        settleToIndex({
          animationRef,
          immediate: true,
          index: clamped,
          panelWidth: panelWidthRef.current,
          prefersReducedMotion,
          settleTransitionEnabled,
          x,
        });
        onActiveIndexChange(clamped);
      },
    }),
    [onActiveIndexChange, prefersReducedMotion, safeCount, settleTransitionEnabled, x]
  );

  const handleJumpClickCapture = (event: MouseEvent<HTMLDivElement>) => {
    if (!jumpClickEnabled) {
      return;
    }

    const target = (event.target as HTMLElement | null)?.closest(
      `[${jumpAttribute}]`
    );

    if (!target) {
      return;
    }

    const raw = target.getAttribute(jumpAttribute);

    if (raw == null) {
      return;
    }

    const next = parseJumpIndex(raw);

    if (next === null || next < 0 || next >= safeCount || next === safeIndex) {
      return;
    }

    onActiveIndexChange(next);
  };

  const resolvePanelClass = (i: number): string | undefined => {
    if (typeof panelClassName === "function") {
      return panelClassName(i);
    }

    return panelClassName;
  };

  if (panelCount < 1) {
    return null;
  }

  const handleDragEnd = (_event: PointerEvent, info: PanInfo) => {
    if (!dragEnabled) {
      settleToIndex({
        animationRef,
        immediate: false,
        index: safeIndex,
        panelWidth: panelWidthRef.current,
        prefersReducedMotion,
        settleTransitionEnabled,
        x,
      });
      return;
    }

    const distance = info.offset.x;
    const velocity = info.velocity.x;
    const nextIndex = panelIndexFromSwipeIntent({
      currentIndex: safeIndex,
      distancePx: distance,
      panelCount: safeCount,
      swipeDistanceThresholdPx,
      swipeVelocityPxPerSec: velocity,
      swipeVelocityThresholdPxPerSec,
    });

    settleToIndex({
      animationRef,
      immediate: false,
      index: nextIndex,
      panelWidth: panelWidthRef.current,
      prefersReducedMotion,
      settleTransitionEnabled,
      x,
    });

    if (nextIndex !== safeIndex) {
      onActiveIndexChange(nextIndex);
    }
  };

  const dragConstraints = {
    left: -Math.max(0, safeCount - 1) * panelWidthRef.current,
    right: 0,
  };

  return (
    <div
      className={className}
      data-parallel-track=""
      data-parallel-track-delta-sign="1"
      onClickCapture={handleJumpClickCapture}
      ref={rootRef}
      style={{
        display: "flex",
        flex: 1,
        flexDirection: "column",
        height: "100%",
        minHeight: 0,
        overflow: "hidden",
        overscrollBehavior: "none",
        width: "100%",
      }}
    >
      <motion.div
        className={trackClassName}
        data-parallel-track-track=""
        drag={dragEnabled ? "x" : false}
        dragConstraints={dragConstraints}
        dragDirectionLock
        dragElastic={0.08}
        dragMomentum
        onDragEnd={handleDragEnd}
        style={{
          WebkitOverflowScrolling: "touch",
          display: "flex",
          flexDirection: "row",
          flexWrap: "nowrap",
          height: "100%",
          minHeight: 0,
          overscrollBehaviorX: "none",
          overscrollBehaviorY: "none",
          touchAction: dragEnabled ? "pan-y pinch-zoom" : "auto",
          width: "100%",
          x,
        }}
      >
        {panels.map((panel, i) => {
          const visible = i === safeIndex;
          const resolvedClass = resolvePanelClass(i);

          return (
            <section
              aria-hidden={!visible}
              className={resolvedClass}
              data-parallel-track-panel={String(i)}
              // biome-ignore lint/suspicious/noArrayIndexKey: panel list is fixed child order, not a reorderable list
              key={i}
              onClickCapture={(e) => onPanelClickCapture?.(e, i)}
              style={{
                flex: "0 0 100%",
                height: "100%",
                maxWidth: "100%",
                minWidth: "100%",
                overflow: "hidden",
                position: "relative",
                width: "100%",
              }}
            >
              {panel}
            </section>
          );
        })}
      </motion.div>
    </div>
  );
});

ParallelTrack.displayName = "ParallelTrack";
