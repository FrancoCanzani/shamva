import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import type { EnvBindings } from "../../../../../bindings";
import { supabase } from "../../../lib/supabase/client";
import type { ApiVariables } from "../../../lib/types";
import { HTTPException } from "hono/http-exception";
import { openApiErrorResponses } from "../../../lib/utils";
import { HeartbeatSchema } from "./schemas";

const route = createRoute({
  method: "get",
  path: "/heartbeats",
  request: {
    query: z.object({
      workspaceId: z
        .uuid()
        .openapi({ example: "a81bc81b-dead-4e5d-abff-90865d1e13b1" }),
    }),
  },
  responses: {
    200: {
      description: "OK",
      content: {
        "application/json": {
          schema: z.object({
            data: z.array(HeartbeatSchema),
            success: z.literal(true),
            error: z.null(),
          }),
        },
      },
    },
    ...openApiErrorResponses,
  },
});

export default function registerGetAllHeartbeats(
  api: OpenAPIHono<{ Bindings: EnvBindings; Variables: ApiVariables }>
) {
  return api.openapi(route, async (c) => {
    const userId = c.get("userId");
    const { workspaceId } = c.req.valid("query");

    const { data: membership, error: membershipError } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", userId)
      .eq("invitation_status", "accepted")
      .single();

    if (membershipError || !membership) {
      throw new HTTPException(403, {
        message: "Unauthorized to list heartbeats",
      });
    }

    const { data: heartbeats, error } = await supabase
      .from("heartbeats")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new HTTPException(500, { message: "Failed to fetch heartbeats" });
    }

    return c.json({ data: heartbeats ?? [], success: true, error: null });
  });
}
