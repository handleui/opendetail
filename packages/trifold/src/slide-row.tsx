"use client";

import { motion, useReducedMotion } from "motion/react";
import {
  Children,
  forwardRef,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useImperativeHandle,
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

const DEFAULT_DIRECTION_LOCK_PX = 6;
const DEFAULT_HORIZONTAL_DOMINANCE = 1.08;
const DEFAULT_FLICK_VELOCITY_PX_PER_MS = 0.32;
const DEFAULT_SNAP_BOUNDARY_FRACTION = 0.38;

const DEFAULT_SPRING: TrifoldSpringConfig = {
  damping: 38,
  mass: 0.72,
  stiffness: 560,
};

type DragPhase = "idle" | "pending" | "horizontal" | "vertical";

interface DragRecord {
  lastClientX: number;
  lastTime: number;
  originIndex: number;
  pointerId: number;
  startClientX: number;
  startClientY: number;
}

export const SlideRow = forwardRef<SlideRowHandle, SlideRowProps>(
  function SlideRow(
    {
      activeIndex,
      children,
      className,
      directionLockPx = DEFAULT_DIRECTION_LOCK_PX,
      dragEnabled = true,
      flickVelocityPxPerMs = DEFAULT_FLICK_VELOCITY_PX_PER_MS,
      horizontalDominance = DEFAULT_HORIZONTAL_DOMINANCE,
      onActiveIndexChange,
      onPanelClickCapture,
      panelClassName,
      slideToAttribute = SLIDE_TO_ATTRIBUTE,
      slideToClickEnabled = true,
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

    const panels = Children.toArray(children);
    const panelCount = panels.length;
    const safeCount = Math.max(1, panelCount);
    const safeIndex = Math.min(Math.max(0, activeIndex), safeCount - 1);

    const [viewportWidth, setViewportWidth] = useState(400);
    const [dragPx, setDragPx] = useState(0);
    const [phase, setPhase] = useState<DragPhase>("idle");
    const phaseRef = useRef<DragPhase>("idle");
    const dragRef = useRef<DragRecord | null>(null);
    const activeIndexRef = useRef(safeIndex);
    activeIndexRef.current = safeIndex;

    const setPhaseBoth = useCallback((next: DragPhase) => {
      phaseRef.current = next;
      setPhase(next);
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
          setDragPx(0);
          return;
        }

        const totalDx = event.clientX - drag.startClientX;
        const dt = Math.max(4, event.timeStamp - drag.lastTime);
        const velocity = (event.clientX - drag.lastClientX) / dt;

        const finalX = trackXForDragN(
          drag.originIndex,
          totalDx,
          viewportWidth,
          safeCount
        );

        let next: number;

        if (velocity > flickVelocityPxPerMs && drag.originIndex > 0) {
          next = drag.originIndex - 1;
        } else if (
          velocity < -flickVelocityPxPerMs &&
          drag.originIndex < safeCount - 1
        ) {
          next = drag.originIndex + 1;
        } else {
          next = panelIndexFromTrackXN(
            finalX,
            viewportWidth,
            safeCount,
            snapBoundaryFraction
          );
        }

        onActiveIndexChange(next);
        setDragPx(0);
      },
      [
        flickVelocityPxPerMs,
        onActiveIndexChange,
        setPhaseBoth,
        snapBoundaryFraction,
        safeCount,
        viewportWidth,
      ]
    );

    const onPointerDown = (event: ReactPointerEvent<HTMLElement>) => {
      if (!dragEnabled || event.button !== 0) {
        return;
      }

      dragRef.current = {
        lastClientX: event.clientX,
        lastTime: event.timeStamp,
        originIndex: activeIndexRef.current,
        pointerId: event.pointerId,
        startClientX: event.clientX,
        startClientY: event.clientY,
      };
      setPhaseBoth("pending");
      setDragPx(0);
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

        if (absX < directionLockPx && absY < directionLockPx) {
          return;
        }

        if (absX > absY * horizontalDominance) {
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

      setDragPx(dx);
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
      setDragPx(0);
      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch {
        // ignore
      }
    };

    const trackX =
      phase === "horizontal" && dragRef.current
        ? trackXForDragN(
            dragRef.current.originIndex,
            dragPx,
            viewportWidth,
            safeCount
          )
        : -safeIndex * viewportWidth;

    let transition: TrifoldSpringConfig | { duration: number };
    if (prefersReducedMotion) {
      transition = { duration: 0 };
    } else if (phase === "horizontal") {
      transition = { duration: 0 };
    } else {
      transition = spring;
    }

    const edgeHandlers = dragEnabled
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

    const trackWidthVw = safeCount * 100;

    if (panelCount < 1) {
      return null;
    }

    return (
      <div
        className={className}
        data-slide-row=""
        onClickCapture={handleSlideToClickCapture}
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
            animate={{ x: trackX }}
            className={trackClassName}
            data-slide-row-track=""
            style={{
              display: "flex",
              flexDirection: "row",
              flexWrap: "nowrap",
              height: "100%",
              maxWidth: "none",
              width: `${trackWidthVw}vw`,
            }}
            transition={transition}
          >
            {panels.map((panel, i) => {
              const activePointer = dragEnabled && i === safeIndex;
              const resolvedClass = resolvePanelClass(i);
              return (
                <section
                  aria-hidden={safeIndex !== i}
                  className={resolvedClass}
                  data-slide-row-panel={String(i)}
                  inert={safeIndex !== i}
                  // biome-ignore lint/suspicious/noArrayIndexKey: panel list is fixed child order, not a reorderable list
                  key={i}
                  onClickCapture={(e) => onPanelClickCapture?.(e, i)}
                  style={{
                    flex: "none",
                    height: "100%",
                    maxWidth: "100vw",
                    minWidth: "100vw",
                    overflow: "hidden",
                    position: "relative",
                    touchAction: "pan-y",
                    width: "100vw",
                  }}
                  {...(activePointer ? edgeHandlers : {})}
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
