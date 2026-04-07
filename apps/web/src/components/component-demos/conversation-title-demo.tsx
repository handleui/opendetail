"use client";

import {
  Composer,
  type ComposerRequest,
  useOpenDetail,
} from "opendetail-react";
import type { FormEvent } from "react";

/**
 * Live title from the same path as the app: `useOpenDetail` + `POST /api/opendetail`,
 * with `conversationTitle: true` on each send here via `startFreshConversation` (docs-only).
 */
export const ConversationTitleDemo = () => {
  const { conversationTitle, question, setQuestion, status, stop, submit } =
    useOpenDetail({
      endpoint: "/api/opendetail",
      persistence: {
        key: "opendetail-web-docs-conversation-title-demo",
        storage: "session",
      },
      sitePaths: [
        "/docs",
        "/docs/hooks/use-opendetail",
        "/docs/hooks/create-open-detail-client",
      ],
    });

  const displayTitle = conversationTitle ?? "New chat";

  const handleSubmit = async (
    request: ComposerRequest,
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    await submit({
      question: request.question,
      startFreshConversation: true,
    });
  };

  return (
    <div className="mx-auto flex min-h-[min(70vh,22rem)] w-full max-w-[400px] flex-col items-center justify-center gap-6">
      <p className="px-2 text-center font-normal text-[15px] text-neutral-950 capitalize">
        {displayTitle}
      </p>
      <div className="w-full">
        <Composer
          name="conversation-title-demo"
          onStop={stop}
          onSubmit={handleSubmit}
          onValueChange={setQuestion}
          placeholder="Each send starts a new chat and requests a title"
          requestState={status}
          showShellUnderlay={true}
          size="shell"
          value={question}
        />
      </div>
    </div>
  );
};
