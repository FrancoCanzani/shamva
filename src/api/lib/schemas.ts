import z from "zod";

export const MonitorsParamsSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Monitor name cannot be empty")
    .max(100, "Monitor name is too long"),
  url: z.string().url({ message: "Invalid URL format" }),
  method: z.enum(["GET", "POST", "HEAD"]).default("GET"),
  regions: z.array(z.string()).min(1),
  interval: z.number().int().optional(),
  headers: z.record(z.string(), z.string()).optional(),
  body: z
    .union([
      z.string(), // Allows plain text or pre-stringified JSON
      z.record(z.string(), z.unknown()),
    ])
    .nullable()
    .optional(),
});
