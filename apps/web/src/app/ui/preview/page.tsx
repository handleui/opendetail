import { SandboxPreviewClient } from "@/components/ui-sandbox/sandbox-preview-client";
import { knownSourcePageUrls } from "@/lib/known-source-page-urls";
import type { SandboxThemeId } from "@/lib/ui-sandbox/primitives";
import { SANDBOX_THEME_IDS } from "@/lib/ui-sandbox/primitives";

function parseTheme(value: string | undefined): SandboxThemeId {
  if (value && (SANDBOX_THEME_IDS as readonly string[]).includes(value)) {
    return value as SandboxThemeId;
  }
  return "default";
}

export default async function SandboxPreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ primitive?: string; theme?: string }>;
}) {
  const sp = await searchParams;

  return (
    <SandboxPreviewClient
      knownSourcePageUrls={knownSourcePageUrls}
      primitive={sp.primitive ?? "shell"}
      theme={parseTheme(sp.theme)}
    />
  );
}
