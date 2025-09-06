import { z } from "zod";

export const ProfileSchema = z.object({
  id: z.uuid(),
  email: z.email(),
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const UpdateProfileSchema = z.object({
  first_name: z
    .string()
    .min(1, "First name is required")
    .max(50, "First name cannot exceed 50 characters"),
  last_name: z
    .string()
    .min(1, "Last name is required")
    .max(50, "Last name cannot exceed 50 characters"),
});

export const CreateProfileSchema = z.object({
  first_name: z
    .string()
    .min(1, "First name is required")
    .max(50, "First name cannot exceed 50 characters"),
  last_name: z
    .string()
    .min(1, "Last name is required")
    .max(50, "Last name cannot exceed 50 characters"),
});

export type Profile = z.infer<typeof ProfileSchema>;
export type UpdateProfileRequest = z.infer<typeof UpdateProfileSchema>;
export type CreateProfileRequest = z.infer<typeof CreateProfileSchema>;
