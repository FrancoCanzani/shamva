import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import type { EnvBindings } from "../../../../../bindings";
import { supabase } from "../../../lib/supabase/client";
import type { ApiVariables } from "../../../lib/types";
import { openApiErrorResponses } from "../../../lib/utils";
import { ProfileSchema } from "./schemas";

const route = createRoute({
  method: "get",
  path: "/profiles",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: ProfileSchema,
        },
      },
      description: "Get current user profile",
    },
    ...openApiErrorResponses,
  },
});

export default function registerGetProfile(
  api: OpenAPIHono<{ Bindings: EnvBindings; Variables: ApiVariables }>
) {
  return api.openapi(route, async (c) => {
    const userId = c.get("userId");

    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error || !profile) {
        return c.json(
          {
            error: "Profile not found",
          },
          404
        );
      }

      return c.json(profile, 200);
    } catch (error) {
      console.error("Error fetching profile:", error);
      return c.json(
        {
          error: "Internal server error",
        },
        500
      );
    }
  });
}
