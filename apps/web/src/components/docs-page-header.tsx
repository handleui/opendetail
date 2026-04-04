/**
 * Non-root docs pages: large title only (no “Welcome to the” overline).
 */
export function DocsPageHeader({ title }: { title: string }) {
  return (
    <header className="mb-6">
      <h1 className="font-normal text-[28px] text-neutral-950 tracking-[-0.04em]">
        {title}
      </h1>
    </header>
  );
}
