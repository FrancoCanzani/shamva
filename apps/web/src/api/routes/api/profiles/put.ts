import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import type { EnvBindings } from "../../../../../bindings";
import { supabase } from "../../../lib/supabase/client";
import type { ApiVariables } from "../../../lib/types";
import { openApiErrorResponses } from "../../../lib/utils";
import { ProfileSchema, UpdateProfileSchema } from "./schemas";

const route = createRoute({
  method: "put",
  path: "/profiles",
  request: {
    body: {
      content: {
        "application/json": {
          schema: UpdateProfileSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: ProfileSchema,
        },
      },
      description: "Profile updated successfully",
    },
    ...openApiErrorResponses,
  },
});

export default function registerPutProfile(
  api: OpenAPIHono<{ Bindings: EnvBindings; Variables: ApiVariables }>
) {
  return api.openapi(route, async (c) => {
    const userId = c.get("userId");
    const { first_name, last_name } = c.req.valid("json");

    try {
      const full_name = `${first_name} ${last_name}`.trim();

      const { data: profile, error } = await supabase
        .from("profiles")
        .update({
          first_name,
          last_name,
          full_name,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)
        .select()
        .single();

      if (error || !profile) {
        return c.json(
          {
            error: "Failed to update profile",
          },
          error?.code === "PGRST116" ? 404 : 500
        );
      }

      return c.json(profile, 200);
    } catch (error) {
      console.error("Error updating profile:", error);
      return c.json(
        {
          error: "Internal server error",
        },
        500
      );
    }
  });
}
