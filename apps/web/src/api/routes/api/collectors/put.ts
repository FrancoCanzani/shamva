import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import type { EnvBindings } from "../../../../../bindings";
import type { ApiVariables } from "../../../lib/types";
import { supabase } from "../../../lib/supabase/client";
import { HTTPException } from "hono/http-exception";
import { openApiErrorResponses } from "../../../lib/utils";
import {
  CollectorSchema,
  CollectorUpdateBodySchema,
  UUIDParamSchema,
} from "./schemas";

const route = createRoute({
  method: "put",
  path: "/collectors/:id",
  request: {
    params: UUIDParamSchema,
    body: {
      content: { "application/json": { schema: CollectorUpdateBodySchema } },
    },
  },
  responses: {
    200: {
      description: "Updated",
      content: {
        "application/json": {
          schema: z.object({
            data: CollectorSchema,
            success: z.literal(true),
            error: z.null(),
          }),
        },
      },
    },
    ...openApiErrorResponses,
  },
});

export default function registerPutCollectors(
  api: OpenAPIHono<{ Bindings: EnvBindings; Variables: ApiVariables }>
) {
  return api.openapi(route, async (c) => {
    const userId = c.get("userId");
    const { id: collectorId } = c.req.valid("param");
    const { name } = c.req.valid("json");

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

    const { data: updatedCollector, error: updateError } = await supabase
      .from("collectors")
      .update({ name, updated_at: new Date().toISOString() })
      .eq("id", collectorId)
      .select()
      .single();

    if (updateError || !updatedCollector) {
      throw new HTTPException(500, { message: "Failed to update collector" });
    }

    return c.json({ data: updatedCollector, success: true, error: null });
  });
}
