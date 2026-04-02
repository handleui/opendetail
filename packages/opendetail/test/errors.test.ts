import { describe, expect, test } from "vitest";
import { toOpenDetailPublicError } from "../src/errors";

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
