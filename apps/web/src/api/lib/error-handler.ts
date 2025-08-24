import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { ZodError, z } from "zod";

type ApiErrorResponse = {
  data: null;
  success: false;
  error: string;
  details?: string;
};

function getRequestContext(c: Context) {
  return {
    method: c.req.method,
    path: c.req.path,
    userId: c.get("userId"),
  };
}

export function handleApiError(error: unknown, c: Context): Response {
  if (error instanceof ZodError) {
    const message = "Validation error";
    const pretty = z.prettifyError(error);
    console.warn("[API] ValidationError", {
      ...getRequestContext(c),
      error: pretty,
    });
    const body: ApiErrorResponse = {
      data: null,
      success: false,
      error: message,
      details: pretty,
    };
    return c.json(body, 400);
  }

  if (error instanceof HTTPException) {
    if (error.status >= 500) {
      console.error("[API] HTTPException", {
        ...getRequestContext(c),
        status: error.status,
        message: error.message,
      });
    } else {
      console.warn("[API] HTTPException", {
        ...getRequestContext(c),
        status: error.status,
        message: error.message,
      });
    }
    const body: ApiErrorResponse = {
      data: null,
      success: false,
      error: error.message,
    };
    return c.json(body, error.status);
  }

  const message = error instanceof Error ? error.message : String(error);
  console.error("[API] UnknownError", {
    ...getRequestContext(c),
    message,
    stack: error instanceof Error ? error.stack : undefined,
  });
  const body: ApiErrorResponse = {
    data: null,
    success: false,
    error: message || "Something went wrong",
  };
  return c.json(body, 500);
}
