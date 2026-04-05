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
  SLIDE_TO_ATTRIBUTE,
  type SlideRowHandle,
  type SlideRowProps,
} from "./slide-row-types.js";
import type { TrifoldSpringConfig } from "./types.js";

const DEFAULT_SNAP_BOUNDARY_FRACTION = 0.38;

const DEFAULT_SPRING: TrifoldSpringConfig = {
  damping: 44,
  mass: 0.62,
  stiffness: 720,
};

const GESTURE_DEFAULTS = {
  fine: {
    directionLockPx: 10,
    flickVelocityPxPerMs: 0.22,
    horizontalDominance: 1.18,
  },
  touch: {
    directionLockPx: 6,
    flickVelocityPxPerMs: 0.32,
    horizontalDominance: 1.08,
  },
} as const;

type DragPhase = "idle" | "pending" | "horizontal" | "vertical";

type InputKind = "fine" | "touch";

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

function resolveInputKind(
  gestureInput: SlideRowProps["gestureInput"],
  pointerType: string
): InputKind {
  if (gestureInput === "touch") {
    return "touch";
  }
  if (gestureInput === "fine") {
    return "fine";
  }
  return pointerType === "touch" ? "touch" : "fine";
}

function isLikelyHorizontalWheel(event: WheelEvent): boolean {
  const absX = Math.abs(event.deltaX);
  const absY = Math.abs(event.deltaY);
  if (absX < 6 && absY > absX * 1.2) {
    return false;
  }
  return absX >= 1;
}

function shouldBlockSplitPointerNav(
  splitLayoutConfigured: boolean,
  splitActive: boolean,
  safeCount: number,
  splitPointerNavigation: boolean | undefined
): boolean {
  return (
    splitLayoutConfigured &&
    splitActive &&
    safeCount >= 2 &&
    splitPointerNavigation !== true
  );
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

function pointerInDragMargins(
  event: ReactPointerEvent<HTMLElement>,
  margins: SlideRowProps["dragActivationMarginsPx"]
): boolean {
  if (!margins) {
    return true;
  }
  const { left, right } = margins;
  if ((left == null || left <= 0) && (right == null || right <= 0)) {
    return true;
  }
  const rect = event.currentTarget.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const w = rect.width;
  const inLeft = left != null && left > 0 && x <= left;
  const inRight = right != null && right > 0 && x >= w - right;
  return inLeft || inRight;
}

function snapshotGesture(
  p: Pick<
    SlideRowProps,
    | "directionLockPx"
    | "directionLockPxFine"
    | "directionLockPxTouch"
    | "flickVelocityPxPerMs"
    | "flickVelocityPxPerMsFine"
    | "flickVelocityPxPerMsTouch"
    | "horizontalDominance"
    | "horizontalDominanceFine"
    | "horizontalDominanceTouch"
  >,
  kind: InputKind
) {
  const d = GESTURE_DEFAULTS[kind];
  if (kind === "touch") {
    return {
      directionLockPx:
        p.directionLockPxTouch ?? p.directionLockPx ?? d.directionLockPx,
      flickVelocityPxPerMs:
        p.flickVelocityPxPerMsTouch ??
        p.flickVelocityPxPerMs ??
        d.flickVelocityPxPerMs,
      horizontalDominance:
        p.horizontalDominanceTouch ??
        p.horizontalDominance ??
        d.horizontalDominance,
    };
  }
  return {
    directionLockPx:
      p.directionLockPxFine ?? p.directionLockPx ?? d.directionLockPx,
    flickVelocityPxPerMs:
      p.flickVelocityPxPerMsFine ??
      p.flickVelocityPxPerMs ??
      d.flickVelocityPxPerMs,
    horizontalDominance:
      p.horizontalDominanceFine ??
      p.horizontalDominance ??
      d.horizontalDominance,
  };
}

export const SlideRow = forwardRef<SlideRowHandle, SlideRowProps>(
  function SlideRow(
    {
      activeIndex,
      children,
      className,
      directionLockPx,
      directionLockPxFine,
      directionLockPxTouch,
      dragActivationMarginsPx,
      dragCommitThresholdPx,
      dragEnabled = true,
      dragRevealDeadZonePx = 0,
      finePointerDragEnabled = false,
      flickVelocityPxPerMs,
      flickVelocityPxPerMsFine,
      flickVelocityPxPerMsTouch,
      gestureInput = "auto",
      horizontalDeltaSign = 1,
      horizontalDominance,
      horizontalDominanceFine,
      horizontalDominanceTouch,
      onActiveIndexChange,
      onPanelClickCapture,
      panelClassName,
      slideToAttribute = SLIDE_TO_ATTRIBUTE,
      slideToClickEnabled = true,
      snapBoundaryFraction = DEFAULT_SNAP_BOUNDARY_FRACTION,
      spring: springPartial,
      settleTransitionEnabled = true,
      splitLayout = false,
      splitPointerNavigation,
      trackClassName,
      wheelHorizontalEnabled = false,
      wheelHorizontalThresholdPx = 100,
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

    const gestureProps = {
      directionLockPx,
      directionLockPxFine,
      directionLockPxTouch,
      flickVelocityPxPerMs,
      flickVelocityPxPerMsFine,
      flickVelocityPxPerMsTouch,
      horizontalDominance,
      horizontalDominanceFine,
      horizontalDominanceTouch,
    };

    const panels = Children.toArray(children);
    const panelCount = panels.length;
    const safeCount = Math.max(1, panelCount);
    const safeIndex = Math.min(Math.max(0, activeIndex), safeCount - 1);

    const [viewportWidth, setViewportWidth] = useState(400);
    const [splitActive, setSplitActive] = useState(false);

    const phaseRef = useRef<DragPhase>("idle");
    const dragRef = useRef<DragRecord | null>(null);
    const activeIndexRef = useRef(safeIndex);
    activeIndexRef.current = safeIndex;

    const safeIndexRef = useRef(safeIndex);
    safeIndexRef.current = safeIndex;

    const hSign = horizontalDeltaSign ?? 1;
    const splitLayoutConfigured = Boolean(splitLayout);
    const blockSplitNav = shouldBlockSplitPointerNav(
      splitLayoutConfigured,
      splitActive,
      safeCount,
      splitPointerNavigation
    );
    const effectivePointerDrag = dragEnabled && !blockSplitNav;
    const effectiveWheelNav =
      wheelHorizontalEnabled && dragEnabled && !blockSplitNav;

    const rootRef = useRef<HTMLDivElement | null>(null);
    const wheelAccumRef = useRef(0);
    const wheelClearTimeoutRef = useRef<
      ReturnType<typeof setTimeout> | undefined
    >(undefined);

    const x = useMotionValue(0);
    const snapControlsRef = useRef<ReturnType<typeof animate> | null>(null);
    const didHydrateLayoutRef = useRef(false);

    const setPhaseBoth = useCallback((next: DragPhase) => {
      phaseRef.current = next;
    }, []);

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

    useEffect(() => {
      if (!splitLayout || safeCount < 2) {
        setSplitActive(false);
        return;
      }
      const minW = splitLayout.minWidthPx ?? 1024;
      const mq = window.matchMedia(`(min-width: ${minW}px)`);
      const sync = () => {
        setSplitActive(mq.matches);
      };
      sync();
      mq.addEventListener("change", sync);
      return () => mq.removeEventListener("change", sync);
    }, [safeCount, splitLayout]);

    const stepPx =
      splitActive && safeCount >= 2 ? viewportWidth / 2 : viewportWidth;
    const stepPxRef = useRef(stepPx);
    stepPxRef.current = stepPx;

    const snapXToIndex = useCallback(
      (index: number) => -index * stepPx,
      [stepPx]
    );

    /** Snap track to `activeIndex` with one spring — no React state driving `x` per frame. */
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

    // biome-ignore lint/correctness/useExhaustiveDependencies: reset wheel accumulation when the focused panel changes
    useEffect(() => {
      wheelAccumRef.current = 0;
    }, [safeIndex]);

    useEffect(() => {
      if (!effectiveWheelNav) {
        wheelAccumRef.current = 0;
      }
    }, [effectiveWheelNav]);

    useEffect(() => {
      if (!effectiveWheelNav) {
        return;
      }
      const el = rootRef.current;
      if (!el) {
        return;
      }
      const flushWheelIdle = () => {
        wheelAccumRef.current = 0;
        const target = snapXToIndex(safeIndexRef.current);
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
      };
      const onWheel = (event: WheelEvent) => {
        if (!isLikelyHorizontalWheel(event)) {
          return;
        }
        event.preventDefault();
        snapControlsRef.current?.stop();

        const th = wheelHorizontalThresholdPx;
        const prev = wheelAccumRef.current;
        const next = prev + hSign * event.deltaX;

        if (next <= -th) {
          const i = activeIndexRef.current;
          wheelAccumRef.current = 0;
          if (i < safeCount - 1) {
            onActiveIndexChange(i + 1);
          } else {
            x.set(trackXForDragN(i, hSign * 0, stepPxRef.current, safeCount));
          }
        } else if (next >= th) {
          const i = activeIndexRef.current;
          wheelAccumRef.current = 0;
          if (i > 0) {
            onActiveIndexChange(i - 1);
          } else {
            x.set(trackXForDragN(i, hSign * 0, stepPxRef.current, safeCount));
          }
        } else {
          wheelAccumRef.current = next;
          x.set(
            trackXForDragN(
              safeIndexRef.current,
              hSign * next,
              stepPxRef.current,
              safeCount
            )
          );
        }

        if (wheelClearTimeoutRef.current !== undefined) {
          clearTimeout(wheelClearTimeoutRef.current);
        }
        wheelClearTimeoutRef.current = setTimeout(flushWheelIdle, 180);
      };
      el.addEventListener("wheel", onWheel, { passive: false });
      return () => {
        el.removeEventListener("wheel", onWheel);
        if (wheelClearTimeoutRef.current !== undefined) {
          clearTimeout(wheelClearTimeoutRef.current);
        }
      };
    }, [
      effectiveWheelNav,
      hSign,
      onActiveIndexChange,
      prefersReducedMotion,
      safeCount,
      settleTransitionEnabled,
      snapXToIndex,
      springTransition,
      wheelHorizontalThresholdPx,
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
      if (!effectivePointerDrag || event.button !== 0) {
        return;
      }

      const isFine = event.pointerType !== "touch";
      if (isFine && !finePointerDragEnabled) {
        return;
      }

      if (!pointerInDragMargins(event, dragActivationMarginsPx)) {
        return;
      }

      const kind = resolveInputKind(gestureInput, event.pointerType);
      const g = snapshotGesture(gestureProps, kind);

      snapControlsRef.current?.stop();
      wheelAccumRef.current = 0;
      if (wheelClearTimeoutRef.current !== undefined) {
        clearTimeout(wheelClearTimeoutRef.current);
      }

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

    const edgeHandlers = effectivePointerDrag
      ? {
          onPointerCancel,
          onPointerDown,
          onPointerMove,
          onPointerUp,
        }
      : {};

    const handleSlideToClickCapture = (
      event: React.MouseEvent<HTMLDivElement>
    ) => {
      if (!slideToClickEnabled) {
        return;
      }
      const target = (event.target as HTMLElement | null)?.closest(
        `[${slideToAttribute}]`
      );
      if (!target) {
        return;
      }
      const raw = target.getAttribute(slideToAttribute);
      if (raw == null) {
        return;
      }
      const next = Number.parseInt(raw, 10);
      if (
        !Number.isFinite(next) ||
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

    const trackWidthVw =
      splitActive && safeCount >= 2 ? safeCount * 50 : safeCount * 100;
    const panelWidthVw = splitActive && safeCount >= 2 ? 50 : 100;

    const panelIsVisible = (i: number) => {
      if (!(splitActive && safeCount >= 2)) {
        return i === safeIndex;
      }
      if (safeIndex < safeCount - 1) {
        return i === safeIndex || i === safeIndex + 1;
      }
      return i === safeIndex - 1 || i === safeIndex;
    };

    const panelAcceptsDrag = (i: number) => {
      if (!effectivePointerDrag) {
        return false;
      }
      return panelIsVisible(i);
    };

    if (panelCount < 1) {
      return null;
    }

    return (
      <div
        className={className}
        data-slide-row=""
        data-slide-row-delta-sign={hSign === -1 ? "-1" : "1"}
        data-slide-row-split={
          splitActive && safeCount >= 2 ? "true" : undefined
        }
        data-slide-row-split-pointer={
          blockSplitNav ? "actions-only" : undefined
        }
        onClickCapture={handleSlideToClickCapture}
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
            data-slide-row-track=""
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
              const visible = panelIsVisible(i);
              const resolvedClass = resolvePanelClass(i);
              return (
                <section
                  aria-hidden={!visible}
                  className={resolvedClass}
                  data-slide-row-panel={String(i)}
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
                  {...(panelAcceptsDrag(i) ? edgeHandlers : {})}
                >
                  {panel}
                </section>
              );
            })}
          </motion.div>
        </div>
      </div>
    );
  }
);

SlideRow.displayName = "SlideRow";
