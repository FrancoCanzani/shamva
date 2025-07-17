import type { Context, Next } from "hono";
import { createSupabaseClient } from "../supabase/client";

export const authMiddleware = async (c: Context, next: Next) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ error: "Missing or invalid Authorization header" }, 401);
  }

  const jwt = authHeader.split(" ")[1];
  if (!jwt) {
    return c.json({ error: "Missing token" }, 401);
  }

  const supabase = createSupabaseClient(c.env);
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(jwt);

  if (error || !user) {
    console.error("Auth Error:", error?.message);
    return c.json({ error: "Invalid token or authentication failed" }, 401);
  }

  c.set("user", user);
  c.set("userId", user.id);

  await next();
};
