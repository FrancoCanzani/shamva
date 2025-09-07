import type { Context, Next } from "hono";
import { HTTPException } from "hono/http-exception";
import { supabase } from "../supabase/client";

export const authMiddleware = async (c: Context, next: Next) => {
  const path = c.req.path;
  if (
    path.startsWith("/docs") ||
    path.startsWith("/api/docs") ||
    path.startsWith("/api/v1/docs") ||
    path.startsWith("/api/v1/public/status")
  ) {
    return next();
  }

  const authHeader = c.req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new HTTPException(401, {
      message: "Missing or invalid Authorization header",
    });
  }

  const jwt = authHeader.split(" ")[1];

  if (!jwt) {
    throw new HTTPException(401, { message: "Missing token" });
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(jwt);

  if (error || !user) {
    console.error("Auth Error:", error?.message);
    throw new HTTPException(401, {
      message: "Invalid token or authentication failed",
    });
  }

  c.set("user", user);
  c.set("userId", user.id);

  await next();
};
