import { z } from "zod";
import { MAX_QUESTION_LENGTH } from "./constants";
import { OpenDetailError } from "./errors";
import type { OpenDetailAnswerInput } from "./types";

export const INVALID_REQUEST_BODY_MESSAGE = `Request body must be valid JSON with the shape { question: string } and a question length of at most ${MAX_QUESTION_LENGTH} characters.`;

export const OpenDetailAnswerInputSchema = z
  .object({
    conversationTitle: z.boolean().optional(),
    question: z.string().trim().min(1).max(MAX_QUESTION_LENGTH),
  })
  .strict();

export const parseOpenDetailAnswerInput = (
  value: unknown
): OpenDetailAnswerInput => {
  const parsedInput = OpenDetailAnswerInputSchema.safeParse(value);

  if (!parsedInput.success) {
    throw new OpenDetailError(
      `Question must be a non-empty string with at most ${MAX_QUESTION_LENGTH} characters.`
    );
  }

  return parsedInput.data;
};
