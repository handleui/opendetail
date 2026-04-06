"use client";

import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
} from "motion/react";
import {
  Children,
  forwardRef,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { panelIndexFromTrackXN, trackXForDragN } from "./gesture-math.js";
import {
  PARALLEL_INDEX_ATTRIBUTE,
  type ParallelTrackHandle,
  type ParallelTrackProps,
} from "./parallel-track-types.js";
import type { TrifoldSpringConfig } from "./types.js";

const DEFAULT_SNAP_BOUNDARY_FRACTION = 0.38;

const DEFAULT_SPRING: TrifoldSpringConfig = {
  damping: 44,
  mass: 0.62,
  stiffness: 720,
};

const TOUCH_GESTURE = {
  directionLockPx: 6,
  flickVelocityPxPerMs: 0.32,
  horizontalDominance: 1.08,
} as const;

type DragPhase = "idle" | "pending" | "horizontal" | "vertical";

interface DragRecord {
  directionLockPx: number;
  flickVelocityPxPerMs: number;
  horizontalDominance: number;
  lastClientX: number;
  lastTime: number;
  originIndex: number;
  pointerId: number;
  startClientX: number;
  startClientY: number;
}

function applyHorizontalDeadZone(rawDx: number, deadPx: number): number {
  if (deadPx <= 0) {
    return rawDx;
  }
  let sign = 0;
  if (rawDx > 0) {
    sign = 1;
  } else if (rawDx < 0) {
    sign = -1;
  }
  const mag = Math.abs(rawDx);
  return sign * Math.max(0, mag - deadPx);
}

function nextIndexAfterDragRelease(params: {
  commitThresholdPx: number | undefined;
  deadPx: number;
  flickThreshold: number;
  hSign: number;
  originIndex: number;
  rawTotal: number;
  safeCount: number;
  snapBoundaryFraction: number;
  stepPx: number;
  velocity: number;
}): number {
  const {
    commitThresholdPx,
    deadPx,
    flickThreshold,
    hSign,
    originIndex,
    rawTotal,
    safeCount,
    snapBoundaryFraction,
    stepPx,
    velocity,
  } = params;

  if (
    commitThresholdPx != null &&
    commitThresholdPx > 0 &&
    Math.abs(rawTotal) >= commitThresholdPx
  ) {
    if (rawTotal < 0 && originIndex < safeCount - 1) {
      return originIndex + 1;
    }
    if (rawTotal > 0 && originIndex > 0) {
      return originIndex - 1;
    }
    return originIndex;
  }

  if (velocity > flickThreshold && originIndex > 0) {
    return originIndex - 1;
  }
  if (velocity < -flickThreshold && originIndex < safeCount - 1) {
    return originIndex + 1;
  }

  const easedTotal = hSign * applyHorizontalDeadZone(rawTotal, deadPx);
  const finalX = trackXForDragN(originIndex, easedTotal, stepPx, safeCount);
  return panelIndexFromTrackXN(finalX, stepPx, safeCount, snapBoundaryFraction);
}

function defaultParseJumpIndex(raw: string): number | null {
  const next = Number.parseInt(raw, 10);
  if (!Number.isFinite(next)) {
    return null;
  }
  return next;
}

export const ParallelTrack = forwardRef<
  ParallelTrackHandle,
  ParallelTrackProps
>(function ParallelTrack(
  {
    activeIndex,
    children,
    className,
    directionLockPx = TOUCH_GESTURE.directionLockPx,
    dragCommitThresholdPx,
    dragEnabled = true,
    dragRevealDeadZonePx = 0,
    flickVelocityPxPerMs = TOUCH_GESTURE.flickVelocityPxPerMs,
    horizontalDeltaSign = 1,
    horizontalDominance = TOUCH_GESTURE.horizontalDominance,
    jumpAttribute = PARALLEL_INDEX_ATTRIBUTE,
    jumpClickEnabled = true,
    onActiveIndexChange,
    onPanelClickCapture,
    panelClassName,
    parseJumpIndex = defaultParseJumpIndex,
    settleTransitionEnabled = true,
    snapBoundaryFraction = DEFAULT_SNAP_BOUNDARY_FRACTION,
    spring: springPartial,
    trackClassName,
  },
  ref
) {
  const prefersReducedMotion = useReducedMotion();
  const spring: TrifoldSpringConfig = {
    ...DEFAULT_SPRING,
    ...springPartial,
  };

  const springTransition = useMemo(
    () => ({
      damping: spring.damping,
      mass: spring.mass,
      stiffness: spring.stiffness,
      type: "spring" as const,
    }),
    [spring.damping, spring.mass, spring.stiffness]
  );

  const panels = Children.toArray(children);
  const panelCount = panels.length;
  const safeCount = Math.max(1, panelCount);
  const safeIndex = Math.min(Math.max(0, activeIndex), safeCount - 1);

  const [viewportWidth, setViewportWidth] = useState(400);

  const phaseRef = useRef<DragPhase>("idle");
  const dragRef = useRef<DragRecord | null>(null);
  const activeIndexRef = useRef(safeIndex);
  activeIndexRef.current = safeIndex;

  const safeIndexRef = useRef(safeIndex);
  safeIndexRef.current = safeIndex;

  const hSign = horizontalDeltaSign ?? 1;

  const x = useMotionValue(0);
  const snapControlsRef = useRef<ReturnType<typeof animate> | null>(null);
  const didHydrateLayoutRef = useRef(false);

  const setPhaseBoth = useCallback((next: DragPhase) => {
    phaseRef.current = next;
  }, []);

  const stepPx = viewportWidth;
  const stepPxRef = useRef(stepPx);
  stepPxRef.current = stepPx;

  useImperativeHandle(
    ref,
    () => ({
      goTo: (index: number) => {
        const clamped = Math.min(Math.max(0, index), safeCount - 1);
        onActiveIndexChange(clamped);
      },
    }),
    [onActiveIndexChange, safeCount]
  );

  useEffect(() => {
    const update = () => {
      setViewportWidth(window.innerWidth);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const snapXToIndex = useCallback(
    (index: number) => -index * stepPx,
    [stepPx]
  );

  useLayoutEffect(() => {
    const target = snapXToIndex(safeIndex);
    if (!didHydrateLayoutRef.current) {
      didHydrateLayoutRef.current = true;
      x.set(target);
      return;
    }
    if (!settleTransitionEnabled) {
      snapControlsRef.current?.stop();
      x.set(target);
      return;
    }
    if (prefersReducedMotion) {
      snapControlsRef.current?.stop();
      x.set(target);
      return;
    }
    snapControlsRef.current?.stop();
    snapControlsRef.current = animate(x, target, springTransition);
  }, [
    prefersReducedMotion,
    safeIndex,
    settleTransitionEnabled,
    snapXToIndex,
    springTransition,
    x,
  ]);

  const endDrag = useCallback(
    (event: PointerEvent | ReactPointerEvent<HTMLElement>) => {
      const drag = dragRef.current;

      if (!drag || event.pointerId !== drag.pointerId) {
        return;
      }

      dragRef.current = null;
      const wasHorizontal = phaseRef.current === "horizontal";
      setPhaseBoth("idle");

      if (!wasHorizontal) {
        return;
      }

      const rawTotal = event.clientX - drag.startClientX;
      const dead = dragRevealDeadZonePx ?? 0;
      const dt = Math.max(4, event.timeStamp - drag.lastTime);
      const velocity = (hSign * (event.clientX - drag.lastClientX)) / dt;

      const next = nextIndexAfterDragRelease({
        commitThresholdPx: dragCommitThresholdPx,
        deadPx: dead,
        flickThreshold: drag.flickVelocityPxPerMs,
        hSign,
        originIndex: drag.originIndex,
        rawTotal,
        safeCount,
        snapBoundaryFraction,
        stepPx: stepPxRef.current,
        velocity,
      });

      if (next !== drag.originIndex) {
        onActiveIndexChange(next);
        return;
      }

      const target = snapXToIndex(next);
      if (prefersReducedMotion) {
        snapControlsRef.current?.stop();
        x.set(target);
        return;
      }
      if (!settleTransitionEnabled) {
        snapControlsRef.current?.stop();
        x.set(target);
        return;
      }
      snapControlsRef.current?.stop();
      snapControlsRef.current = animate(x, target, springTransition);
    },
    [
      dragCommitThresholdPx,
      dragRevealDeadZonePx,
      hSign,
      onActiveIndexChange,
      prefersReducedMotion,
      setPhaseBoth,
      snapBoundaryFraction,
      safeCount,
      settleTransitionEnabled,
      snapXToIndex,
      springTransition,
      x,
    ]
  );

  const onPointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    if (!dragEnabled || event.button !== 0) {
      return;
    }

    if (event.pointerType !== "touch") {
      return;
    }

    const g = {
      directionLockPx,
      flickVelocityPxPerMs,
      horizontalDominance,
    };

    snapControlsRef.current?.stop();

    dragRef.current = {
      ...g,
      lastClientX: event.clientX,
      lastTime: event.timeStamp,
      originIndex: activeIndexRef.current,
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
    };
    setPhaseBoth("pending");
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    const drag = dragRef.current;

    if (!drag || event.pointerId !== drag.pointerId) {
      return;
    }

    const dx = event.clientX - drag.startClientX;
    const dy = event.clientY - drag.startClientY;

    if (phaseRef.current === "pending") {
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);

      if (absX < drag.directionLockPx && absY < drag.directionLockPx) {
        return;
      }

      if (absX > absY * drag.horizontalDominance) {
        snapControlsRef.current?.stop();
        setPhaseBoth("horizontal");
      } else {
        dragRef.current = null;
        setPhaseBoth("idle");
        try {
          event.currentTarget.releasePointerCapture(event.pointerId);
        } catch {
          // ignore
        }
        return;
      }
    }

    if (phaseRef.current !== "horizontal") {
      return;
    }

    const dead = dragRevealDeadZonePx ?? 0;
    x.set(
      trackXForDragN(
        drag.originIndex,
        hSign * applyHorizontalDeadZone(dx, dead),
        stepPxRef.current,
        safeCount
      )
    );
    drag.lastClientX = event.clientX;
    drag.lastTime = event.timeStamp;
  };

  const onPointerUp = (event: ReactPointerEvent<HTMLElement>) => {
    endDrag(event);
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // ignore
    }
  };

  const onPointerCancel = (event: ReactPointerEvent<HTMLElement>) => {
    dragRef.current = null;
    setPhaseBoth("idle");
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // ignore
    }
  };

  const edgeHandlers = dragEnabled
    ? {
        onPointerCancel,
        onPointerDown,
        onPointerMove,
        onPointerUp,
      }
    : {};

  const handleJumpClickCapture = (event: React.MouseEvent<HTMLDivElement>) => {
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
    if (
      next === null ||
      next < 0 ||
      next >= safeCount ||
      next === activeIndexRef.current
    ) {
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

  const trackWidthVw = safeCount * 100;
  const panelWidthVw = 100;

  if (panelCount < 1) {
    return null;
  }

  return (
    <div
      className={className}
      data-parallel-track=""
      data-parallel-track-delta-sign={hSign === -1 ? "-1" : "1"}
      onClickCapture={handleJumpClickCapture}
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
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
          position: "relative",
        }}
      >
        <motion.div
          className={trackClassName}
          data-parallel-track-track=""
          style={{
            display: "flex",
            flexDirection: "row",
            flexWrap: "nowrap",
            height: "100%",
            maxWidth: "none",
            width: `${trackWidthVw}vw`,
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
                inert={!visible}
                // biome-ignore lint/suspicious/noArrayIndexKey: panel list is fixed child order, not a reorderable list
                key={i}
                onClickCapture={(e) => onPanelClickCapture?.(e, i)}
                style={{
                  flex: "none",
                  height: "100%",
                  maxWidth: `${panelWidthVw}vw`,
                  minWidth: `${panelWidthVw}vw`,
                  overflow: "hidden",
                  position: "relative",
                  touchAction: "pan-y",
                  width: `${panelWidthVw}vw`,
                }}
                {...edgeHandlers}
              >
                {panel}
              </section>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
});

ParallelTrack.displayName = "ParallelTrack";
