import z from "zod";

const validIntervals = [30000, 60000, 120000, 300000, 600000, 900000];

export const MonitorFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Monitor name cannot be empty")
      .max(100, "Monitor name is too long"),
    url: z.string().trim().url("Please enter a valid URL"),
    method: z.enum(["GET", "POST", "HEAD"], {
      errorMap: () => ({ message: "Please select a valid method" }),
    }),
    interval: z
      .number()
      .refine(
        (val) =>
          validIntervals.includes(val as (typeof validIntervals)[number]),
        {
          message: "Please select a valid check interval",
        },
      ),
    regions: z.array(z.string()).min(1, {
      message: "Please select at least one monitoring region",
    }),
    headersString: z
      .string()
      .trim()
      .optional()
      .nullable()
      .refine(
        (val) => {
          if (!val || val === "") return true;
          try {
            const parsed = JSON.parse(val);
            // Ensure it's an object, not an array or null
            return (
              typeof parsed === "object" &&
              parsed !== null &&
              !Array.isArray(parsed)
            );
          } catch {
            return false;
          }
        },
        {
          message:
            'Headers must be a valid JSON object string, e.g. {"key": "value"}',
        },
      )
      .transform((val) => (val === "" ? null : val)),
    bodyString: z
      .string()
      .trim()
      .optional()
      .nullable()
      .refine(
        (val) => {
          if (!val || val === "") return true;
          try {
            JSON.parse(val);
            return true;
          } catch {
            return false;
          }
        },
        {
          message:
            'Body must be a valid JSON string, e.g. {"key": "value"} or "text"',
        },
      )
      .transform((val) => (val === "" ? null : val)),
  })
  .refine(
    (data) =>
      !(data.method !== "POST" && data.bodyString && data.bodyString !== ""),
    {
      message: "Request body is only applicable for POST method",
      path: ["bodyString"],
    },
  );

export const WorkspaceSchema = z.object({
  name: z
    .string()
    .min(1, "Workspace name is required")
    .max(100, "Workspace name cannot exceed 100 characters"),
  description: z
    .string()
    .max(500, "Description cannot exceed 500 characters")
    .optional(),
  members: z.array(
    z.object({
      email: z
        .string()
        .email("Please enter a valid email address")
        .min(1, "Email is required"),
      role: z.enum(["admin", "member", "viewer"], {
        errorMap: () => ({ message: "Please select a valid role" }),
      }),
    }),
  ),
});
