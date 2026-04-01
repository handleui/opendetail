import { describe, expect, test } from "vitest";
import { buildOpenDetailIndex } from "../src/build";
import { DEFAULT_FALLBACK_TEXT } from "../src/constants";
import { createOpenDetail } from "../src/runtime";
import { createFixtureWorkspace, removeWorkspace } from "./helpers";

describe("live smoke test", () => {
  test.runIf(Boolean(process.env.OPENAI_API_KEY))(
    "answers a grounded question end to end",
    async () => {
      const cwd = await createFixtureWorkspace("basic");

      try {
        await buildOpenDetailIndex({ cwd });

        const assistant = createOpenDetail({ cwd });
        const result = await assistant.answer({
          question: "How do I install opendetail?",
        });

        expect(result.text).not.toBe(DEFAULT_FALLBACK_TEXT);
        expect(result.text).toContain("[1]");
      } finally {
        await removeWorkspace(cwd);
      }
    }
  );
});
