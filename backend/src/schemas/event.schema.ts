import { z } from "zod";

const commonFields = {
  timestamp: z
    .string()
    .datetime({ offset: false })
    .refine((value) => value.endsWith("Z"), "Timestamp must be UTC"),
  environment: z.enum(["production", "staging", "development"]),
};

export const eventSchema = z.discriminatedUnion("type", [
  z.object({
    ...commonFields,
    type: z.literal("request"),
    route: z.string().min(1),
    method: z.string().min(1),
    statusCode: z.number().int(),
    durationMs: z.number().nonnegative(),
  }),

  z.object({
    ...commonFields,
    type: z.literal("error"),
    errorType: z.string().min(1),
    message: z.string().min(1),
    stackTrace: z.string().min(1),
    url: z.string().optional(),
    userId: z.string().optional(),
    browser: z.string().optional(),
  }),
]);

export type EventInput = z.infer<typeof eventSchema>;
