import Link from "next/link";

import { appName, docsRoute } from "@/lib/shared";

export default function HomePage() {
  return (
    <main className="w-full">
      <p className="font-normal text-[28px] text-neutral-950 tracking-[-0.04em]">
        {appName}
      </p>
      <p className="mt-3 text-[16px] text-neutral-600 leading-relaxed">
        Grounded answers from your own Markdown and MDX — built for product
        teams who already ship docs and for developers who want a small,
        inspectable pipeline (local index file, narrow API, streaming events you
        can actually render).
      </p>

      <h2 className="mt-12 mb-3 font-normal text-lg text-neutral-950">
        In one sentence
      </h2>
      <p className="text-[14px] text-neutral-800 leading-relaxed">
        Index docs at build time, answer from that index at request time, cite
        sources instead of guessing — same content humans read on the web, wired
        for your app and for agents that consume machine-readable routes.
      </p>

      <h2 className="mt-10 mb-3 font-normal text-lg text-neutral-950">
        Try the assistant here
      </h2>
      <p className="text-[14px] text-neutral-800 leading-relaxed">
        Press{" "}
        <kbd className="rounded border border-neutral-200 bg-neutral-50 px-1.5 py-0.5 font-mono text-[13px] text-neutral-800">
          ⌘
        </kbd>{" "}
        /{" "}
        <kbd className="rounded border border-neutral-200 bg-neutral-50 px-1.5 py-0.5 font-mono text-[13px] text-neutral-800">
          Ctrl
        </kbd>{" "}
        +{" "}
        <kbd className="rounded border border-neutral-200 bg-neutral-50 px-1.5 py-0.5 font-mono text-[13px] text-neutral-800">
          J
        </kbd>{" "}
        to open the sidebar and ask questions against this site&apos;s docs
        index.
      </p>

      <nav
        aria-label="Next steps"
        className="mt-12 flex flex-col gap-3 text-[14px] sm:flex-row sm:flex-wrap sm:gap-x-6"
      >
        <Link
          className="font-medium text-neutral-950 underline-offset-4 hover:underline"
          href={docsRoute}
        >
          Read the documentation
        </Link>
        <Link
          className="font-medium text-neutral-950 underline-offset-4 hover:underline"
          href="/docs/quickstart"
        >
          Start with the quickstart
        </Link>
      </nav>
    </main>
  );
}
