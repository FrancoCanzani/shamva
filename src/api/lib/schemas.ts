import z from "zod";

export const MonitorsParamsSchema = z.object({
  url: z.string().url({ message: "Invalid URL format" }),
  method: z.enum(["GET", "POST", "HEAD"]).default("GET"),
  interval: z.number().int().optional(),
  headers: z.record(z.string(), z.string()).optional(),
  body: z
    .union([
      z.string(), // Allows plain text or pre-stringified JSON
      z.record(z.string(), z.unknown()),
    ])
    .optional(),
});
