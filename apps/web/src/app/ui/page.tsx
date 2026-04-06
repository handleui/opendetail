import type { Metadata } from "next";

import { UiSandboxPage } from "@/components/ui-sandbox/ui-sandbox-page";

export const metadata: Metadata = {
  title: "UI sandbox",
  description:
    "Interactive previews for OpenDetail React primitives — switch system, theme, and component; props and notes beside the live demo.",
  alternates: {
    canonical: "/ui",
  },
  openGraph: {
    url: "/ui",
    title: "UI sandbox | OpenDetail",
    description:
      "Interactive previews for OpenDetail React primitives with theme switching.",
  },
};

export default function UiPage() {
  return (
    <article className="docs-article flex min-h-0 flex-1 flex-col pb-16">
      <div className="mb-8">
        <h1 className="mb-2 font-medium text-[28px] text-black tracking-tight">
          UI sandbox
        </h1>
        <p className="max-w-2xl text-[15px] text-neutral-600 leading-relaxed">
          Live previews for OpenDetail primitives. Choose a theme and component;
          hook APIs live under{" "}
          <a
            className="text-neutral-900 underline decoration-neutral-300 underline-offset-2 hover:decoration-neutral-500"
            href="/docs/hooks/use-opendetail"
          >
            Docs → Hooks
          </a>
          .
        </p>
      </div>
      <UiSandboxPage />
    </article>
  );
}
