import { appName } from "@/lib/shared";

/**
 * Docs home (`/docs`) title block — Figma node 40:86 (overline + title, default weight).
 */
export function DocsLandingHeader() {
  return (
    <header className="mb-6 flex flex-col gap-2">
      <p className="font-normal text-[#a4a4a4] text-[16px] tracking-[-0.04em]">
        Welcome to the
      </p>
      <h1 className="font-normal text-[28px] text-neutral-950 tracking-[-0.04em]">
        {appName} Documentation
      </h1>
    </header>
  );
}
