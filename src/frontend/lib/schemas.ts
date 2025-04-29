import z from "zod";

export const MonitorFormSchema = z
  .object({
    url: z.string().trim().url("Please enter a valid URL"),
    method: z.enum(["GET", "POST", "HEAD"], {
      errorMap: () => ({ message: "Please select a valid method" }),
    }),
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
            return (
              typeof parsed === "object" &&
              parsed !== null &&
              !Array.isArray(parsed)
            );
          } catch {
            return false;
          }
        },
        { message: "Headers must be a valid JSON object" },
      ),
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
        { message: "Body must be valid JSON" },
      ),
  })
  .refine(
    (data) =>
      !(data.method !== "POST" && data.bodyString && data.bodyString !== ""),
    {
      message: "Request body is only applicable for POST method",
      path: ["bodyString"],
    },
  );
