"use client";

import type { ReactNode } from "react";
import { useEffect, useRef } from "react";

/**
 * Stroked preview stage with white base + canvas stipple noise (varying dot opacity).
 * Keeps demos off flat grey fills while staying lightweight (no WebGL).
 */
export function ComponentPreviewSurface({ children }: { children: ReactNode }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!(host && canvas)) {
      return;
    }

    const paint = () => {
      const rect = host.getBoundingClientRect();
      const w = Math.max(1, Math.floor(rect.width));
      const h = Math.max(1, Math.floor(rect.height));
      const dpr = Math.min(window.devicePixelRatio ?? 1, 2);

      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        return;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, w, h);

      const sparse = Math.floor((w * h) / 2000);
      for (let i = 0; i < sparse; i++) {
        const x = Math.floor(Math.random() * w);
        const y = Math.floor(Math.random() * h);
        const a = 0.025 + Math.random() * 0.11;
        ctx.fillStyle = `rgba(0,0,0,${a})`;
        ctx.fillRect(x, y, 1, 1);
      }

      ctx.fillStyle = "rgba(0,0,0,0.035)";
      for (let x = 0; x < w; x += 12) {
        for (let y = 0; y < h; y += 12) {
          if ((x / 12 + y / 12) % 2 === 0) {
            ctx.fillRect(x, y, 1, 1);
          }
        }
      }
    };

    paint();
    const ro = new ResizeObserver(paint);
    ro.observe(host);
    return () => {
      ro.disconnect();
    };
  }, []);

  return (
    <div
      className="relative flex min-h-[80vh] w-full flex-col items-center justify-center overflow-hidden rounded-xl border border-solid bg-white p-6"
      ref={hostRef}
      style={{ borderColor: "var(--opendetail-color-sidebar-stroke)" }}
    >
      <canvas
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit]"
        ref={canvasRef}
      />
      <div className="relative z-10 flex w-full flex-col items-center justify-center">
        {children}
      </div>
    </div>
  );
}
