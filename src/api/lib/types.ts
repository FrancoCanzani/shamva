import type { User } from "@supabase/supabase-js";

export type ApiVariables = {
  user: User;
  userId: string;
};
