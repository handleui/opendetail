import Link from "next/link";

import { docsRoute } from "@/lib/shared";

export default function HomePage() {
  return (
    <main className="mx-auto w-full max-w-[650px] px-4 py-16 sm:px-6">
      <p className="text-[14px] text-neutral-600 leading-relaxed">
        OpenDetail — documentation-grounded assistant for your app. Open the
        docs, or press{" "}
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
        for the assistant.
      </p>
      <p className="mt-6 text-[14px]">
        <Link
          className="font-medium text-neutral-950 underline-offset-4 hover:underline"
          href={docsRoute}
        >
          Browse documentation
        </Link>
      </p>
    </main>
  );
}
