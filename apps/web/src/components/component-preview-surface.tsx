import type { ReactNode } from "react";

/**
 * Stroked preview stage — solid white, no texture (keeps demos readable).
 */
export function ComponentPreviewSurface({ children }: { children: ReactNode }) {
  return (
    <div
      className="relative flex min-h-[min(70vh,28rem)] w-full flex-col items-center justify-center overflow-hidden rounded-xl border border-solid bg-white p-6"
      style={{ borderColor: "var(--opendetail-color-sidebar-stroke)" }}
    >
      <div className="relative flex w-full flex-col items-center justify-center">
        {children}
      </div>
    </div>
  );
}
