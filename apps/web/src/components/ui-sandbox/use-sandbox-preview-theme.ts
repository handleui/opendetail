import { useEffect } from "react";

import type { SandboxThemeId } from "@/lib/ui-sandbox/primitives";

/**
 * Loads palette theme CSS inside the **preview document only** (iframe).
 * Base OpenDetail tokens come from `globals.css` (`opendetail-base.css`).
 */
export function useSandboxPreviewTheme(theme: SandboxThemeId): void {
  useEffect(() => {
    if (theme === "default") {
      return;
    }
    const p =
      theme === "midnight"
        ? import("opendetail-react/styles/opendetail-midnight.css")
        : import("opendetail-react/styles/opendetail-signal.css");
    p.then(() => undefined);
  }, [theme]);
}
