"use client";

import { motion, useReducedMotion } from "motion/react";
import type { AssistantSidebarMobileShellSlots } from "opendetail-react";
import {
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

const DIRECTION_LOCK_PX = 10;
const HORIZONTAL_DOMINANCE = 1.22;
const FLICK_VELOCITY_PX_PER_MS = 0.55;

const settleTransition = {
  damping: 38,
  mass: 0.72,
  stiffness: 560,
} as const;

type DragPhase = "idle" | "pending" | "horizontal" | "vertical";

interface DragRecord {
  lastClientX: number;
  lastTime: number;
  originIndex: AssistantSidebarMobileShellSlots["panelIndex"];
  pointerId: number;
  startClientX: number;
  startClientY: number;
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

/** Track translateX: 0 = nav fully visible, -vw = main, -2vw = assistant. */
const trackXForDrag = (
  originIndex: AssistantSidebarMobileShellSlots["panelIndex"],
  dx: number,
  viewportWidth: number
): number => {
  const minX = -2 * viewportWidth;
  const maxX = 0;
  return clamp(-originIndex * viewportWidth + dx, minX, maxX);
};

const panelIndexFromTrackX = (
  trackX: number,
  viewportWidth: number
): AssistantSidebarMobileShellSlots["panelIndex"] => {
  const raw = Math.round(-trackX / viewportWidth);
  return clamp(raw, 0, 2) as AssistantSidebarMobileShellSlots["panelIndex"];
};

export function MobileTriptychShell({
  assistant,
  main,
  navigation,
  panelIndex,
  setPanelIndex,
}: AssistantSidebarMobileShellSlots) {
  const prefersReducedMotion = useReducedMotion();
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

      let next: AssistantSidebarMobileShellSlots["panelIndex"];

      if (velocity > FLICK_VELOCITY_PX_PER_MS && drag.originIndex > 0) {
        next = (drag.originIndex -
          1) as AssistantSidebarMobileShellSlots["panelIndex"];
      } else if (velocity < -FLICK_VELOCITY_PX_PER_MS && drag.originIndex < 2) {
        next = (drag.originIndex +
          1) as AssistantSidebarMobileShellSlots["panelIndex"];
      } else {
        next = panelIndexFromTrackX(finalX, viewportWidth);
      }

      setPanelIndex(next);
      setDragPx(0);
    },
    [setPanelIndex, setPhaseBoth, viewportWidth]
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

      if (absX < DIRECTION_LOCK_PX && absY < DIRECTION_LOCK_PX) {
        return;
      }

      if (absX > absY * HORIZONTAL_DOMINANCE) {
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

  let transition: typeof settleTransition | { duration: number };
  if (prefersReducedMotion) {
    transition = { duration: 0 };
  } else if (phase === "horizontal") {
    transition = { duration: 0 };
  } else {
    transition = settleTransition;
  }

  const edgeHandlers = {
    onPointerCancel,
    onPointerDown,
    onPointerMove,
    onPointerUp,
  };

  const handleNavLinkCapture = (event: React.MouseEvent<HTMLElement>) => {
    const target = event.target as HTMLElement | null;
    if (target?.closest("a[href]")) {
      setPanelIndex(1);
    }
  };

  return (
    <div className="mobile-triptych flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden overscroll-none">
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <motion.div
          animate={{ x: trackX }}
          className="flex h-full w-[300vw] max-w-none flex-row flex-nowrap"
          transition={transition}
        >
          <section
            aria-hidden={panelIndex !== 0}
            className="relative flex h-full w-screen min-w-[100vw] max-w-[100vw] flex-none flex-col overflow-hidden border-[var(--opendetail-color-sidebar-stroke)] border-e border-solid bg-white"
            inert={panelIndex !== 0}
            onClickCapture={handleNavLinkCapture}
            style={{ touchAction: "pan-y" }}
          >
            {navigation}
          </section>

          <section
            aria-hidden={panelIndex !== 1}
            className="relative flex h-full w-screen min-w-[100vw] max-w-[100vw] flex-none flex-col overflow-hidden bg-white"
            inert={panelIndex !== 1}
            style={{ touchAction: "pan-y" }}
            {...edgeHandlers}
          >
            <div className="mobile-triptych__main relative min-h-0 flex-1 overflow-hidden">
              {main}
            </div>
          </section>

          <section
            aria-hidden={panelIndex !== 2}
            className="relative flex h-full w-screen min-w-[100vw] max-w-[100vw] flex-none flex-col overflow-hidden bg-[var(--opendetail-color-background)]"
            inert={panelIndex !== 2}
            style={{ touchAction: "pan-y" }}
            {...(panelIndex === 2 ? edgeHandlers : {})}
          >
            {assistant}
          </section>
        </motion.div>
      </div>
    </div>
  );
}
