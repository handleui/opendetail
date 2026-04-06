"use client";

import { UserMessage } from "opendetail-react";

export const UserMessageDemo = () => (
  <div className="flex w-full max-w-md flex-1 flex-col">
    <UserMessage>Short user prompt in the thread.</UserMessage>
  </div>
);
