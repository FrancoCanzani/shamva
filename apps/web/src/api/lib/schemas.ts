import { z } from "zod";

export const BodyContentSchema = z.object({
  raw: z.string().nullable(),
  truncated: z.boolean(),
  parsed: z.record(z.string(), z.unknown()).nullable().optional(),
  contentType: z.string().nullable().optional(),
  parseError: z.string().nullable().optional(),
});
