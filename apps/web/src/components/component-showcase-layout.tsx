import type { ReactNode } from "react";

const PREVIEW_CLASS =
  "flex min-h-[80vh] w-full flex-col items-center justify-center rounded-xl border border-solid bg-[var(--opendetail-color-surface)] p-6";

export const ComponentShowcaseLayout = ({
  preview,
  children,
}: {
  preview: ReactNode;
  children: ReactNode;
}) => (
  <div className="flex w-full flex-col gap-10">
    <div
      className={PREVIEW_CLASS}
      style={{ borderColor: "var(--opendetail-color-sidebar-stroke)" }}
    >
      {preview}
    </div>
    <div className="mx-auto w-full max-w-[650px] pb-16">{children}</div>
  </div>
);
