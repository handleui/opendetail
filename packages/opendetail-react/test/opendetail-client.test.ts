import { describe, expect, test, vi } from "vitest";
import { createOpenDetailClient } from "../src/index";

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
        question: "What does public_path do?",
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
        question: "What does public_path do?",
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

    expect(onEvent).toHaveBeenLastCalledWith(
      expect.objectContaining({
        code: "model_incomplete",
        message:
          "The model could not complete the answer before reaching the output token limit.",
        retryable: false,
        type: "error",
      })
    );
  });

  test("parses title stream events before the terminal done event", async () => {
    const streamBody = [
      JSON.stringify({
        model: "gpt-5.4-mini",
        type: "meta",
      }),
      JSON.stringify({
        title: "Short chat title",
        type: "title",
      }),
      JSON.stringify({
        text: "Ready.",
        type: "done",
      }),
    ].join("\n");
    const onEvent = vi.fn();
    const fetchImplementation = vi.fn<typeof fetch>(
      async () => new Response(streamBody, { status: 200 })
    );
    const client = createOpenDetailClient({
      fetch: fetchImplementation,
    });

    await client.submit(
      {
        question: "How do I install opendetail?",
      },
      {
        onEvent,
      }
    );

    expect(onEvent).toHaveBeenCalledWith({
      title: "Short chat title",
      type: "title",
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

  test("fails fast when a stream event shape is invalid", async () => {
    const fetchImplementation = vi.fn<typeof fetch>(
      async () =>
        new Response(
          `${JSON.stringify({
            type: "done",
          })}\n`,
          { status: 200 }
        )
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

  test("fails when a stream ends without a terminal event", async () => {
    const fetchImplementation = vi.fn<typeof fetch>(
      async () =>
        new Response(
          `${JSON.stringify({
            text: "Partial answer",
            type: "delta",
          })}\n`,
          { status: 200 }
        )
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

  test("uses a custom endpoint and forwards transport headers", async () => {
    const fetchImplementation = vi.fn<typeof fetch>(
      async () =>
        new Response(
          `${JSON.stringify({
            text: "Ready.",
            type: "done",
          })}\n`,
          { status: 200 }
        )
    );
    const client = createOpenDetailClient({
      endpoint: "https://example.com/opendetail",
      fetch: fetchImplementation,
      headers: {
        authorization: "Bearer test-token",
        "x-custom-header": "custom-value",
      },
    });

    await client.submit({
      question: "How do I install opendetail?",
    });

    expect(fetchImplementation).toHaveBeenCalledWith(
      "https://example.com/opendetail",
      expect.objectContaining({
        headers: expect.any(Headers),
        method: "POST",
      })
    );

    const [, requestInit] = fetchImplementation.mock.calls[0] ?? [];
    const headers = requestInit?.headers as Headers;

    expect(headers.get("accept")).toBe(
      "application/x-ndjson, application/json"
    );
    expect(headers.get("authorization")).toBe("Bearer test-token");
    expect(headers.get("content-type")).toBe("application/json");
    expect(headers.get("x-custom-header")).toBe("custom-value");
  });

  test("supports dynamic transport headers", async () => {
    const fetchImplementation = vi.fn<typeof fetch>(
      async () =>
        new Response(
          `${JSON.stringify({
            text: "Ready.",
            type: "done",
          })}\n`,
          { status: 200 }
        )
    );
    const client = createOpenDetailClient({
      fetch: fetchImplementation,
      headers: () => ({
        authorization: "Bearer dynamic-token",
      }),
    });

    await client.submit({
      question: "How do I install opendetail?",
    });

    const [, requestInit] = fetchImplementation.mock.calls[0] ?? [];
    const headers = requestInit?.headers as Headers;

    expect(headers.get("accept")).toBe(
      "application/x-ndjson, application/json"
    );
    expect(headers.get("authorization")).toBe("Bearer dynamic-token");
    expect(headers.get("content-type")).toBe("application/json");
  });

  test("keeps the latest request pending when an earlier one is aborted", async () => {
    let resolveSecondFetchStart: (() => void) | null = null;
    const secondFetchStarted = new Promise<void>((resolve) => {
      resolveSecondFetchStart = resolve;
    });
    const fetchImplementation = vi
      .fn<typeof fetch>()
      .mockImplementationOnce(
        async (_input, init) =>
          await new Promise<Response>((_resolve, reject) => {
            init?.signal?.addEventListener("abort", () => {
              reject(new Error("Aborted"));
            });
          })
      )
      .mockImplementationOnce(async (_input, init) => {
        resolveSecondFetchStart?.();
        return await new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            reject(new Error("Aborted"));
          });
        });
      });
    const client = createOpenDetailClient({
      fetch: fetchImplementation,
    });

    const firstRequest = client.submit({
      question: "First question",
    });
    const secondRequest = client.submit({
      question: "Second question",
    });

    await secondFetchStarted;
    await firstRequest;

    expect(client.status).toBe("pending");

    client.stop();
    await secondRequest;
  });
});
