import { z } from "zod";
import {
  MAX_QUESTION_LENGTH,
  MAX_SITE_PATH_LENGTH,
  MAX_SITE_PATHS,
} from "./constants";
import { OpenDetailError } from "./errors";
import { normalizeSitePathInput } from "./site-pages";
import type { OpenDetailAnswerInput } from "./types";

export const INVALID_REQUEST_BODY_MESSAGE = `Request body must be valid JSON with the shape { question: string, optional conversationTitle, optional sitePaths } and a question length of at most ${MAX_QUESTION_LENGTH} characters.`;

const normalizeSitePathsList = (paths: string[]): string[] => {
  const unique = new Set<string>();

  for (const path of paths) {
    const normalized = normalizeSitePathInput(path);

    if (normalized !== null) {
      unique.add(normalized);
    }
  }

  return [...unique];
};

export const OpenDetailAnswerInputSchema = z
  .object({
    conversationTitle: z.boolean().optional(),
    question: z.string().trim().min(1).max(MAX_QUESTION_LENGTH),
    sitePaths: z
      .array(
        z
          .string()
          .min(1)
          .max(MAX_SITE_PATH_LENGTH)
          .superRefine((value, context) => {
            if (normalizeSitePathInput(value) === null) {
              context.addIssue({
                code: "custom",
                message: "Invalid site path.",
              });
            }
          })
      )
      .max(MAX_SITE_PATHS)
      .optional(),
  })
  .strip()
  .transform((data) => ({
    ...data,
    sitePaths:
      data.sitePaths === undefined
        ? undefined
        : normalizeSitePathsList(data.sitePaths),
  }));

export const parseOpenDetailAnswerInput = (
  value: unknown
): OpenDetailAnswerInput => {
  const parsedInput = OpenDetailAnswerInputSchema.safeParse(value);

  if (!parsedInput.success) {
    throw new OpenDetailError(
      `Request must include a non-empty question (at most ${MAX_QUESTION_LENGTH} characters) and valid optional fields.`
    );
  }

  return parsedInput.data;
};
