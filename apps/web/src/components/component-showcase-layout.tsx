import type { ReactNode } from "react";

import { ComponentPreviewSurface } from "@/components/component-preview-surface";

export const ComponentShowcaseLayout = ({
  preview,
  children,
}: {
  preview: ReactNode;
  children: ReactNode;
}) => (
  <div className="flex w-full flex-col gap-10">
    <ComponentPreviewSurface>{preview}</ComponentPreviewSurface>
    <div className="mx-auto w-full max-w-[min(100%,72rem)] pb-16">
      {children}
    </div>
  </div>
);
