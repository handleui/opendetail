"use client";

import {
  Children,
  forwardRef,
  type MouseEvent,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useSyncExternalStore,
} from "react";

import {
  PARALLEL_INDEX_ATTRIBUTE,
  type ParallelTrackHandle,
  type ParallelTrackProps,
} from "./parallel-track-types.js";

function defaultParseJumpIndex(raw: string): number | null {
  const next = Number.parseInt(raw, 10);
  if (!Number.isFinite(next)) {
    return null;
  }
  return next;
}

const prefersReducedMotionQuery = "(prefers-reduced-motion: reduce)";

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
    trackClassName,
  },
  ref
) {
  const prefersReducedMotion = usePrefersReducedMotion();

  const panels = Children.toArray(children);
  const panelCount = panels.length;
  const safeCount = Math.max(1, panelCount);
  const safeIndex = Math.min(Math.max(0, activeIndex), safeCount - 1);

  const scrollerRef = useRef<HTMLDivElement>(null);
  const programmaticScrollRef = useRef(false);
  const activeIndexRef = useRef(safeIndex);
  activeIndexRef.current = safeIndex;
  const settleProgrammaticTimerRef = useRef<number | null>(null);
  const scrollFallbackTimerRef = useRef<number | null>(null);
  const didInitialScrollRef = useRef(false);

  useImperativeHandle(
    ref,
    () => ({
      goTo: (index: number) => {
        const el = scrollerRef.current;
        if (!el) {
          return;
        }

        const clamped = Math.min(Math.max(0, index), safeCount - 1);
        const w = el.clientWidth;
        if (w <= 0) {
          return;
        }

        programmaticScrollRef.current = true;
        el.scrollTo({
          behavior: "instant",
          left: clamped * w,
        });

        window.setTimeout(() => {
          programmaticScrollRef.current = false;
        }, 48);

        onActiveIndexChange(clamped);
      },
    }),
    [onActiveIndexChange, safeCount]
  );

  const scrollToIndex = useCallback(
    (index: number, behavior: ScrollBehavior) => {
      const el = scrollerRef.current;
      if (!el) {
        return;
      }

      const w = el.clientWidth;
      if (w <= 0) {
        return;
      }

      programmaticScrollRef.current = true;
      if (settleProgrammaticTimerRef.current !== null) {
        window.clearTimeout(settleProgrammaticTimerRef.current);
      }

      el.scrollTo({
        behavior,
        left: index * w,
      });

      const settleMs = behavior === "smooth" ? 420 : 48;
      settleProgrammaticTimerRef.current = window.setTimeout(() => {
        settleProgrammaticTimerRef.current = null;
        programmaticScrollRef.current = false;
      }, settleMs);
    },
    []
  );

  useLayoutEffect(() => {
    const el = scrollerRef.current;
    if (!el) {
      return;
    }

    const w = el.clientWidth;
    if (w <= 0) {
      return;
    }

    const targetLeft = safeIndex * w;
    if (!didInitialScrollRef.current) {
      didInitialScrollRef.current = true;
      programmaticScrollRef.current = true;
      el.scrollTo({ behavior: "instant", left: targetLeft });
      programmaticScrollRef.current = false;
      return;
    }

    if (Math.abs(el.scrollLeft - targetLeft) < 2) {
      return;
    }

    const behavior: ScrollBehavior =
      settleTransitionEnabled && !prefersReducedMotion ? "smooth" : "instant";

    scrollToIndex(safeIndex, behavior);
  }, [prefersReducedMotion, safeIndex, scrollToIndex, settleTransitionEnabled]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) {
      return;
    }

    const syncActiveFromScroll = () => {
      if (programmaticScrollRef.current) {
        return;
      }

      const w = el.clientWidth;
      if (w <= 0) {
        return;
      }

      const next = Math.round(el.scrollLeft / w);
      const clamped = Math.min(Math.max(0, next), safeCount - 1);

      if (clamped !== activeIndexRef.current) {
        onActiveIndexChange(clamped);
      }
    };

    const onScrollDebounced = () => {
      if (programmaticScrollRef.current) {
        return;
      }

      if (scrollFallbackTimerRef.current !== null) {
        window.clearTimeout(scrollFallbackTimerRef.current);
      }

      scrollFallbackTimerRef.current = window.setTimeout(() => {
        scrollFallbackTimerRef.current = null;
        syncActiveFromScroll();
      }, 100);
    };

    /** iOS/WebKit: keep the track pinned at column edges (no extra horizontal rubber-band). */
    const clampScrollLeft = () => {
      if (programmaticScrollRef.current) {
        return;
      }

      const w = el.clientWidth;
      if (w <= 0) {
        return;
      }

      const maxScroll = (safeCount - 1) * w;
      const { scrollLeft } = el;

      if (scrollLeft < 0) {
        programmaticScrollRef.current = true;
        el.scrollTo({ behavior: "instant", left: 0 });
        programmaticScrollRef.current = false;
        return;
      }

      if (scrollLeft > maxScroll) {
        programmaticScrollRef.current = true;
        el.scrollTo({ behavior: "instant", left: maxScroll });
        programmaticScrollRef.current = false;
      }
    };

    /**
     * After scroll settles (including momentum), snap to the nearest column if the track sits
     * between snap points. Uses `scrollend` so we do not run mid-fling.
     */
    const snapToNearestColumn = () => {
      if (programmaticScrollRef.current) {
        return;
      }

      const w = el.clientWidth;
      if (w <= 0) {
        return;
      }

      const maxIdx = safeCount - 1;
      const nearest = Math.min(
        maxIdx,
        Math.max(0, Math.round(el.scrollLeft / w))
      );
      const target = nearest * w;

      if (Math.abs(el.scrollLeft - target) <= 1) {
        return;
      }

      programmaticScrollRef.current = true;
      el.scrollTo({ behavior: "instant", left: target });
      window.requestAnimationFrame(() => {
        programmaticScrollRef.current = false;
        if (nearest !== activeIndexRef.current) {
          onActiveIndexChange(nearest);
        }
      });
    };

    el.addEventListener("scroll", onScrollDebounced, { passive: true });
    el.addEventListener("scroll", clampScrollLeft, { passive: true });
    el.addEventListener("scrollend", snapToNearestColumn, { passive: true });

    return () => {
      el.removeEventListener("scroll", onScrollDebounced);
      el.removeEventListener("scroll", clampScrollLeft);
      el.removeEventListener("scrollend", snapToNearestColumn);

      if (scrollFallbackTimerRef.current !== null) {
        window.clearTimeout(scrollFallbackTimerRef.current);
      }
    };
  }, [onActiveIndexChange, safeCount]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) {
      return;
    }

    const ro = new ResizeObserver(() => {
      const w = el.clientWidth;
      if (w <= 0) {
        return;
      }

      programmaticScrollRef.current = true;
      el.scrollTo({
        behavior: "instant",
        left: activeIndexRef.current * w,
      });
      programmaticScrollRef.current = false;
    });

    ro.observe(el);

    return () => {
      ro.disconnect();
    };
  }, []);

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

  if (panelCount < 1) {
    return null;
  }

  const horizontalEnabled = dragEnabled;

  return (
    <div
      className={className}
      data-parallel-track=""
      data-parallel-track-delta-sign="1"
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
        className={trackClassName}
        data-parallel-track-track=""
        ref={scrollerRef}
        style={{
          WebkitOverflowScrolling: "touch",
          display: "flex",
          flexDirection: "row",
          flexWrap: "nowrap",
          height: "100%",
          msOverflowStyle: "none",
          overflowX: horizontalEnabled ? "auto" : "hidden",
          overflowY: "hidden",
          overscrollBehaviorX: "none",
          overscrollBehaviorY: "none",
          scrollbarWidth: "none",
          scrollSnapType: horizontalEnabled ? "x mandatory" : "none",
          touchAction: horizontalEnabled ? "pan-x pinch-zoom" : "auto",
          width: "100%",
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
                flex: "none",
                height: "100%",
                maxWidth: "100%",
                minWidth: "100%",
                overflow: "hidden",
                position: "relative",
                scrollSnapAlign: horizontalEnabled ? "start" : "none",
                scrollSnapStop: "normal",
                width: "100%",
              }}
            >
              {panel}
            </section>
          );
        })}
      </div>
    </div>
  );
});

ParallelTrack.displayName = "ParallelTrack";
