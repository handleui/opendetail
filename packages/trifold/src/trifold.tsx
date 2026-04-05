"use client";

import { motion, useReducedMotion } from "motion/react";
import {
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { panelIndexFromTrackX, trackXForDrag } from "./gesture-math.js";
import type { TrifoldProps, TrifoldSpringConfig } from "./types.js";

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
  originIndex: TrifoldProps["panelIndex"];
  pointerId: number;
  startClientX: number;
  startClientY: number;
}

export function Trifold({
  className,
  directionLockPx = DEFAULT_DIRECTION_LOCK_PX,
  flickVelocityPxPerMs = DEFAULT_FLICK_VELOCITY_PX_PER_MS,
  horizontalDominance = DEFAULT_HORIZONTAL_DOMINANCE,
  leading,
  leadingClassName,
  leadingLinkSelector = "a[href]",
  main,
  mainClassName,
  mainContentClassName,
  navigateToCenterOnLeadingLinkClick = true,
  onPanelIndexChange,
  panelIndex,
  spring: springPartial,
  snapBoundaryFraction = DEFAULT_SNAP_BOUNDARY_FRACTION,
  trailing,
  trailingClassName,
  trackClassName,
}: TrifoldProps) {
  const prefersReducedMotion = useReducedMotion();
  const spring: TrifoldSpringConfig = {
    ...DEFAULT_SPRING,
    ...springPartial,
  };

  const [viewportWidth, setViewportWidth] = useState(400);
  const [dragPx, setDragPx] = useState(0);
  const [phase, setPhase] = useState<DragPhase>("idle");
  const phaseRef = useRef<DragPhase>("idle");
  const dragRef = useRef<DragRecord | null>(null);
  const panelIndexRef = useRef(panelIndex);
  panelIndexRef.current = panelIndex;

  const setPhaseBoth = useCallback((next: DragPhase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

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

      const finalX = trackXForDrag(drag.originIndex, totalDx, viewportWidth);

      let next: TrifoldProps["panelIndex"];

      if (velocity > flickVelocityPxPerMs && drag.originIndex > 0) {
        next = (drag.originIndex - 1) as TrifoldProps["panelIndex"];
      } else if (velocity < -flickVelocityPxPerMs && drag.originIndex < 2) {
        next = (drag.originIndex + 1) as TrifoldProps["panelIndex"];
      } else {
        next = panelIndexFromTrackX(
          finalX,
          viewportWidth,
          snapBoundaryFraction
        );
      }

      onPanelIndexChange(next);
      setDragPx(0);
    },
    [
      flickVelocityPxPerMs,
      onPanelIndexChange,
      setPhaseBoth,
      snapBoundaryFraction,
      viewportWidth,
    ]
  );

  const onPointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.button !== 0) {
      return;
    }

    dragRef.current = {
      lastClientX: event.clientX,
      lastTime: event.timeStamp,
      originIndex: panelIndexRef.current,
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
      ? trackXForDrag(dragRef.current.originIndex, dragPx, viewportWidth)
      : -panelIndex * viewportWidth;

  let transition: TrifoldSpringConfig | { duration: number };
  if (prefersReducedMotion) {
    transition = { duration: 0 };
  } else if (phase === "horizontal") {
    transition = { duration: 0 };
  } else {
    transition = spring;
  }

  const edgeHandlers = {
    onPointerCancel,
    onPointerDown,
    onPointerMove,
    onPointerUp,
  };

  const handleLeadingClickCapture = (event: React.MouseEvent<HTMLElement>) => {
    if (!navigateToCenterOnLeadingLinkClick) {
      return;
    }
    const target = event.target as HTMLElement | null;
    if (target?.closest(leadingLinkSelector)) {
      onPanelIndexChange(1);
    }
  };

  const leadingEdge =
    panelIndex === 0 ? edgeHandlers : ({} as typeof edgeHandlers);
  const mainEdge = edgeHandlers;
  const trailingEdge =
    panelIndex === 2 ? edgeHandlers : ({} as typeof edgeHandlers);

  return (
    <div
      className={className}
      data-trifold=""
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
          data-trifold-track=""
          style={{
            display: "flex",
            flexDirection: "row",
            flexWrap: "nowrap",
            height: "100%",
            maxWidth: "none",
            width: "300vw",
          }}
          transition={transition}
        >
          <section
            aria-hidden={panelIndex !== 0}
            className={leadingClassName}
            data-trifold-panel="leading"
            inert={panelIndex !== 0}
            onClickCapture={handleLeadingClickCapture}
            style={{
              backgroundColor: "var(--trifold-leading-bg, #fff)",
              borderInlineEnd:
                "1px solid var(--trifold-leading-border, rgba(0,0,0,0.08))",
              flex: "none",
              height: "100%",
              maxWidth: "100vw",
              minWidth: "100vw",
              overflow: "hidden",
              position: "relative",
              touchAction: "pan-y",
              width: "100vw",
            }}
            {...leadingEdge}
          >
            {leading}
          </section>

          <section
            aria-hidden={panelIndex !== 1}
            className={mainClassName}
            data-trifold-panel="main"
            inert={panelIndex !== 1}
            style={{
              backgroundColor: "var(--trifold-main-bg, #fff)",
              display: "flex",
              flex: "none",
              flexDirection: "column",
              height: "100%",
              maxWidth: "100vw",
              minWidth: "100vw",
              overflow: "hidden",
              position: "relative",
              touchAction: "pan-y",
              width: "100vw",
            }}
            {...mainEdge}
          >
            <div
              className={mainContentClassName}
              data-trifold-main=""
              style={{
                flex: 1,
                minHeight: 0,
                overflow: "hidden",
                position: "relative",
              }}
            >
              {main}
            </div>
          </section>

          <section
            aria-hidden={panelIndex !== 2}
            className={trailingClassName}
            data-trifold-panel="trailing"
            inert={panelIndex !== 2}
            style={{
              backgroundColor:
                "var(--trifold-trailing-bg, var(--trifold-main-bg, #fff))",
              flex: "none",
              height: "100%",
              maxWidth: "100vw",
              minWidth: "100vw",
              overflow: "hidden",
              position: "relative",
              touchAction: "pan-y",
              width: "100vw",
            }}
            {...trailingEdge}
          >
            {trailing}
          </section>
        </motion.div>
      </div>
    </div>
  );
}
