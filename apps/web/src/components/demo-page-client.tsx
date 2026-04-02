"use client";

import { useMemo } from "react";
import { renderFumadocsSourceLink } from "@/components/opendetail-source-link";
import { createFumadocsSourceTargetResolver } from "@/lib/opendetail-source-links";
import { AssistantModal } from "@/registry/blocks/assistant-modal/assistant-modal";
import { useOpenDetail } from "@/registry/hooks/use-opendetail/use-opendetail";

const DEMO_SECTIONS = [
  {
    copy: "A small row of colored squares gives enough contrast to verify the blur and dimming without competing with the overlay itself.",
    squares: ["bg-lime-300", "bg-sky-300", "bg-blue-300", "bg-violet-300"],
    title: "First test block",
  },
  {
    copy: "Scroll a little, send a message, and confirm the thread stays above the page while the input remains on the highest layer.",
    squares: [
      "bg-orange-300",
      "bg-rose-300",
      "bg-yellow-300",
      "bg-emerald-300",
    ],
    title: "Second test block",
  },
] as const;

export const DemoPageClient = ({
  knownSourcePageUrls,
}: {
  knownSourcePageUrls: string[];
}) => {
  const { clearThread, messages, question, setQuestion, status, stop, submit } =
    useOpenDetail({
      persistence: {
        key: "opendetail-demo-thread",
      },
    });
  const resolveSourceTarget = useMemo(
    () => createFumadocsSourceTargetResolver(knownSourcePageUrls),
    [knownSourcePageUrls]
  );

  return (
    <main className="min-h-screen bg-[var(--opendetail-color-background)]">
      <div className="mx-auto flex min-h-screen w-full max-w-[80ch] flex-col gap-12 px-6 py-20">
        <header className="flex flex-col gap-4">
          <p className="text-black/45 text-sm uppercase tracking-[0.24em]">
            OpenDetail Overlay Test
          </p>
          <h1 className="font-medium text-4xl text-black leading-none tracking-[-0.06em] sm:text-5xl">
            Colored blocks and text behind the assistant modal.
          </h1>
          <p className="max-w-[70ch] text-base text-black/65 tracking-[-0.04em] sm:text-lg">
            Use this page to check that the floating input stays on top, the
            white blur dims the full page, and the thread sits above the overlay
            while keeping the background visible underneath.
          </p>
        </header>

        <section className="flex flex-col gap-10">
          {DEMO_SECTIONS.map((section) => (
            <article className="flex flex-col gap-4" key={section.title}>
              <h2 className="text-2xl text-black tracking-[-0.05em]">
                {section.title}
              </h2>
              <p className="max-w-[70ch] text-base text-black/65 tracking-[-0.04em]">
                {section.copy}
              </p>
              <div className="grid grid-cols-4 gap-4">
                {section.squares.map((squareClassName) => (
                  <div
                    className={`${squareClassName} aspect-square w-full`}
                    key={`${section.title}-${squareClassName}`}
                  />
                ))}
              </div>
            </article>
          ))}
        </section>
      </div>

      <AssistantModal
        inputId="opendetail-demo-question"
        messages={messages}
        onCloseThread={clearThread}
        onQuestionChange={setQuestion}
        onStop={stop}
        onSubmitQuestion={submit}
        placeholder="Ask about the product docs"
        question={question}
        renderSourceLink={renderFumadocsSourceLink}
        requestState={status}
        resolveSourceTarget={resolveSourceTarget}
      />
    </main>
  );
};
