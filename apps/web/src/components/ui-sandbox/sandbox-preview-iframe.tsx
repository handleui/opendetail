"use client";

import { buildSandboxPreviewSrc } from "@/lib/ui-sandbox/paths";
import {
  PRIMITIVE_LABELS,
  type SandboxPrimitiveId,
  type SandboxThemeId,
} from "@/lib/ui-sandbox/primitives";

/**
 * Isolated iframe: previews run in `/ui/preview` so palette theme CSS (`:root`)
 * only applies inside this document, not the surrounding docs chrome.
 */
export function SandboxPreviewIframe({
  primitive,
  theme,
}: {
  primitive: SandboxPrimitiveId;
  theme: SandboxThemeId;
}) {
  const src = buildSandboxPreviewSrc(primitive, theme);

  return (
    <iframe
      className="h-[min(70vh,40rem)] min-h-[420px] w-full rounded-xl border border-neutral-200 border-solid bg-neutral-50 shadow-[inset_0_1px_0_rgb(0_0_0/0.04)]"
      key={`${primitive}-${theme}`}
      loading="eager"
      referrerPolicy="same-origin"
      sandbox="allow-scripts allow-same-origin allow-forms"
      src={src}
      title={`OpenDetail preview: ${PRIMITIVE_LABELS[primitive]}`}
    />
  );
}
