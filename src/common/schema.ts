import { z } from "zod";

export const LinkSchema = z
  .object({
    url: z
      .string({
        required_error: "URL is required.",
        invalid_type_error: "URL must be a string.",
      })
      .trim()
      .min(1, { message: "URL cannot be empty." })
      .url({ message: "Invalid URL format provided." }),

    slug: z
      .string()
      .trim()
      .regex(/^[a-zA-Z0-9_-]+$/, {
        message:
          "Slug can only contain letters, numbers, underscores, and hyphens.",
      })
      .min(3, { message: "Slug must be at least 3 characters long." })
      .max(50, { message: "Slug cannot be longer than 50 characters." })
      .optional(),

    title: z
      .string()
      .trim()
      .max(255, { message: "Title cannot exceed 255 characters." })
      .optional(),

    description: z
      .string()
      .trim()
      .max(1024, { message: "Description cannot exceed 1024 characters." })
      .optional(),

    expiresAt: z.coerce
      .date({
        invalid_type_error: "Invalid date format for expiration.",
      })
      .min(new Date(), { message: "Expiration date must be in the future." })
      .nullable()
      .optional(),

    password: z
      .string()
      .min(6, { message: "Password must be at least 6 characters long." })
      .max(100, { message: "Password cannot be longer than 100 characters." })
      .optional(),

    tags: z
      .array(
        z
          .string()
          .trim()
          .min(1, { message: "Tags cannot be empty strings." })
          .max(50, { message: "Individual tags cannot exceed 50 characters." }),
      )
      .max(10, { message: "You can add a maximum of 10 tags." })
      .optional(),

    user_id: z.string().trim().min(1).optional(),

    created_at: z.coerce
      .date({
        invalid_type_error: "Invalid date format for created_at.",
      })
      .optional(),

    updated_at: z.coerce
      .date({
        invalid_type_error: "Invalid date format for updated_at.",
      })
      .optional(),

    click_count: z
      .number()
      .int({ message: "Click count must be an integer." })
      .nonnegative({ message: "Click count cannot be negative." })
      .optional(),

    last_click: z.coerce
      .date({
        invalid_type_error: "Invalid date format for last_click.",
      })
      .nullable()
      .optional(),

    is_active: z.boolean().optional(),
  })
  .strict();

// example
// {
//   url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString",
//   slug: "mdn",
//   title: "MDN Docs - toISOString",
//   description: "Link to the Mozilla Developer Network documentation page for the Date.toISOString() method in JavaScript.",
//   // expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
//   expiresAt: null,
//   password: "supersecretpassword123",
//   tags: ["javascript", "docs", "date", "mdn"],
//   user_id: "franco",
//   is_active: true
// }
