"use client";

import { AssistantSuggestion, AssistantSuggestions } from "opendetail-react";

const noop = () => {
  /* showcase only */
};

export const SuggestionsDemo = () => (
  <div className="w-full max-w-md">
    <AssistantSuggestions>
      <AssistantSuggestion onClick={noop}>
        Summarize the last answer
      </AssistantSuggestion>
      <AssistantSuggestion onClick={noop}>
        What are the next steps?
      </AssistantSuggestion>
      <AssistantSuggestion disabled onClick={noop}>
        Disabled suggestion
      </AssistantSuggestion>
    </AssistantSuggestions>
  </div>
);
