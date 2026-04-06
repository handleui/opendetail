"use client";

import { AssistantResponse, type AssistantSourceItem } from "opendetail-react";

const DEMO_SOURCES: AssistantSourceItem[] = [
  { id: "1", kind: "page", title: "Docs index", url: "/docs" },
  { id: "2", kind: "remote", title: "Example.com", url: "https://example.com" },
];

export const SourcesDemo = () => (
  <div className="w-full max-w-[400px]">
    <AssistantResponse sources={DEMO_SOURCES} status="complete">
      Citations like [1] and [2] appear in the body; matching sources render as
      pills below.
    </AssistantResponse>
  </div>
);
