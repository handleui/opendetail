import { APIConnectionError } from "openai";
import { describe, expect, test } from "vitest";
import { OPENAI_UNREACHABLE_MESSAGE, toOpenDetailPublicError } from "../src/errors";

describe("toOpenDetailPublicError", () => {
  test("does not expose unknown runtime error messages", () => {
    const publicError = toOpenDetailPublicError(
      new Error("Unexpected failure at /private/path")
    );

    expect(publicError).toMatchObject({
      code: "request_failed",
      message: "OpenDetail could not complete the request.",
    });
  });

  test("maps MiniSearch index failures to a rebuild hint without raw engine text", () => {
    const publicError = toOpenDetailPublicError(
      new Error("MiniSearch: duplicate ID index.mdx")
    );

    expect(publicError).toMatchObject({
      code: "request_failed",
      message:
        "The search index is inconsistent or could not be loaded. Run `npx opendetail build` in your app root to regenerate `.opendetail/index.json`.",
    });
  });

  test("maps OpenAI connection errors to provider_unavailable", () => {
    const publicError = toOpenDetailPublicError(
      new APIConnectionError({ cause: undefined })
    );

    expect(publicError).toMatchObject({
      code: "provider_unavailable",
      message: OPENAI_UNREACHABLE_MESSAGE,
      retryable: true,
    });
  });

  test("keeps provider metadata without exposing provider messages", () => {
    const publicError = toOpenDetailPublicError({
      error: {
        code: "rate_limit_exceeded",
        message: "Upstream private detail",
        requestID: "req_123",
        status: 429,
      },
    });

    expect(publicError).toMatchObject({
      code: "provider_rate_limited",
      message: "OpenAI rate limited the request.",
      provider: "openai",
      providerCode: "rate_limit_exceeded",
      requestId: "req_123",
      retryable: true,
      status: 429,
    });
  });
});
