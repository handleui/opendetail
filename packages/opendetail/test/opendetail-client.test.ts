import { describe, expect, test, vi } from "vitest";
import { createOpenDetailClient } from "../../../registry/lib/opendetail-client/opendetail-client";

describe("createOpenDetailClient", () => {
  test("preserves typed JSON route errors", async () => {
    const fetchImplementation = vi.fn<typeof fetch>(async () =>
      Response.json(
        {
          code: "missing_api_key",
          error: "OPENAI_API_KEY is required at runtime.",
          retryable: false,
        },
        { status: 500 }
      )
    );
    const client = createOpenDetailClient({
      fetch: fetchImplementation,
    });

    await expect(
      client.submit({
        question: "What does base_path do?",
      })
    ).rejects.toMatchObject({
      code: "missing_api_key",
      message: "OPENAI_API_KEY is required at runtime.",
      retryable: false,
    });
  });

  test("falls back when the server returns an unknown error code", async () => {
    const fetchImplementation = vi.fn<typeof fetch>(async () =>
      Response.json(
        {
          code: "totally_unknown",
          error: "Unexpected upstream error.",
          retryable: true,
        },
        { status: 500 }
      )
    );
    const client = createOpenDetailClient({
      fetch: fetchImplementation,
    });

    await expect(
      client.submit({
        question: "What does base_path do?",
      })
    ).rejects.toMatchObject({
      code: "request_failed",
      message: "Unexpected upstream error.",
      retryable: false,
    });
  });

  test("preserves typed stream errors while keeping the message visible", async () => {
    const streamBody = [
      JSON.stringify({
        model: "gpt-5.4-mini",
        type: "meta",
      }),
      JSON.stringify({
        code: "model_incomplete",
        message:
          "The model could not complete the answer before reaching the output token limit.",
        retryable: false,
        type: "error",
      }),
    ].join("\n");
    const onEvent = vi.fn();
    const fetchImplementation = vi.fn<typeof fetch>(
      async () => new Response(streamBody, { status: 200 })
    );
    const client = createOpenDetailClient({
      fetch: fetchImplementation,
    });

    await expect(
      client.submit(
        {
          question: "How do I install opendetail?",
        },
        {
          onEvent,
        }
      )
    ).rejects.toMatchObject({
      code: "model_incomplete",
      message:
        "The model could not complete the answer before reaching the output token limit.",
      retryable: false,
    });

    expect(onEvent).toHaveBeenLastCalledWith({
      code: "model_incomplete",
      message:
        "The model could not complete the answer before reaching the output token limit.",
      retryable: false,
      type: "error",
    });
  });

  test("falls back to a typed transport error for malformed stream payloads", async () => {
    const fetchImplementation = vi.fn<typeof fetch>(
      async () => new Response("<html>bad gateway</html>", { status: 200 })
    );
    const client = createOpenDetailClient({
      fetch: fetchImplementation,
    });

    await expect(
      client.submit({
        question: "How do I install opendetail?",
      })
    ).rejects.toMatchObject({
      code: "request_failed",
      message: "OpenDetail request failed.",
      retryable: false,
    });
  });
});
