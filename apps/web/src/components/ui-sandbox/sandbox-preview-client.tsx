"use client";

import { ComponentPreviewSurface } from "@/components/component-preview-surface";
import { SandboxPrimitiveDemo } from "@/components/ui-sandbox/sandbox-demos";
import { useSandboxPreviewTheme } from "@/components/ui-sandbox/use-sandbox-preview-theme";
import { getComponentPreviewPreset } from "@/lib/component-preview-viewport";
import {
  isSandboxPrimitiveId,
  type SandboxPrimitiveId,
  type SandboxThemeId,
} from "@/lib/ui-sandbox/primitives";

export function SandboxPreviewClient({
  knownSourcePageUrls,
  primitive: primitiveRaw,
  theme,
}: {
  knownSourcePageUrls: readonly string[];
  primitive: string;
  theme: SandboxThemeId;
}) {
  const primitive: SandboxPrimitiveId = isSandboxPrimitiveId(primitiveRaw)
    ? primitiveRaw
    : "shell";

  useSandboxPreviewTheme(theme);

  return (
    <div
      className="box-border flex h-full min-h-[420px] w-full min-w-0 flex-col"
      data-od-system="opendetail"
    >
      <ComponentPreviewSurface preset={getComponentPreviewPreset(primitive)}>
        <SandboxPrimitiveDemo
          knownSourcePageUrls={knownSourcePageUrls}
          primitive={primitive}
        />
      </ComponentPreviewSurface>
    </div>
  );
}
