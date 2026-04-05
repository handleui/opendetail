import Link from "next/link";

export function IndexView() {
  return (
    <main className="max-w-prose space-y-4">
      <p className="opacity-80">
        This route is the first panel. Swipe left (touch) or use the link — the
        whole UI slides using{" "}
        <code className="rounded bg-foreground/10 px-1 py-0.5 text-sm">
          SlideRow
        </code>{" "}
        from{" "}
        <code className="rounded bg-foreground/10 px-1 py-0.5 text-sm">
          trifold
        </code>
        , not a separate transition library.
      </p>
      <Link
        className="inline-flex font-medium text-foreground underline underline-offset-4"
        href="/index/detail"
      >
        Go to /index/detail (Next.js navigation + slide)
      </Link>
    </main>
  );
}

export function DetailView() {
  return (
    <main className="max-w-prose space-y-4">
      <p className="opacity-80">
        Second panel, same row. Nested{" "}
        <code className="rounded bg-foreground/10 px-1 py-0.5 text-sm">
          SlideRow
        </code>{" "}
        instances can live inside a panel later for split or master–detail
        stacks.
      </p>
      <div className="flex flex-wrap gap-3">
        <button
          className="rounded-md border border-foreground/20 px-3 py-1.5 text-sm"
          data-slide-to="0"
          type="button"
        >
          data-slide-to=&quot;0&quot;
        </button>
        <Link
          className="rounded-md border border-foreground/20 px-3 py-1.5 text-sm"
          href="/index"
        >
          Link to /index
        </Link>
      </div>
    </main>
  );
}
