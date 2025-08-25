import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { HTTPException } from "hono/http-exception";
import type { EnvBindings } from "../../../../../bindings";
import { supabase } from "../../../lib/supabase/client";
import type { ApiVariables } from "../../../lib/types";
import { openApiErrorResponses } from "../../../lib/utils";

const paramsSchema = z.object({
  id: z.uuid().openapi({
    param: {
      name: "id",
      in: "path",
    },
    example: "a81bc81b-dead-4e5d-abff-90865d1e13b1",
  }),
});

const route = createRoute({
  method: "delete",
  path: "/collectors/:id",
  request: {
    params: paramsSchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({ success: z.boolean() }),
        },
      },
      description: "Deleted",
    },
    ...openApiErrorResponses,
  },
});

export default function registerDeleteCollectors(
  api: OpenAPIHono<{ Bindings: EnvBindings; Variables: ApiVariables }>
) {
  return api.openapi(route, async (c) => {
    const userId = c.get("userId");
    const { id: collectorId } = c.req.valid("param");

    const { data: existingCollector, error: fetchError } = await supabase
      .from("collectors")
      .select("*")
      .eq("id", collectorId)
      .single();

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        throw new HTTPException(404, { message: "Collector not found" });
      }
      throw new HTTPException(500, {
        message: "Database error fetching collector",
      });
    }

    if (!existingCollector) {
      throw new HTTPException(404, { message: "Collector not found" });
    }

    const { data: membership, error: membershipError } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", existingCollector.workspace_id)
      .eq("user_id", userId)
      .eq("invitation_status", "accepted")
      .single();

    if (membershipError || !membership) {
      throw new HTTPException(404, { message: "Collector not found" });
    }

    if (membership.role === "viewer") {
      throw new HTTPException(403, { message: "Insufficient permissions" });
    }

    try {
      const { error: deleteError } = await supabase
        .from("collectors")
        .delete()
        .eq("id", collectorId);

      if (deleteError) {
        throw new HTTPException(500, { message: "Failed to delete collector" });
      }

      return c.json({
        success: true,
      });
    } catch {
      throw new HTTPException(500, { message: "Failed to delete collector" });
    }
  });
}
