import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import type { EnvBindings } from "../../../../../../bindings";
import type { ApiVariables } from "../../../../lib/types";
import {
  NotificationSchema,
  NotificationUpdateSchema,
  UUIDParamSchema,
} from "../schemas";
import { supabase } from "../../../../lib/supabase/client";
import { HTTPException } from "hono/http-exception";
import { openApiErrorResponses } from "../../../../lib/utils";

const route = createRoute({
  method: "put",
  path: "/workspaces/:id/notifications",
  request: {
    params: UUIDParamSchema,
    body: {
      content: { "application/json": { schema: NotificationUpdateSchema } },
    },
  },
  responses: {
    200: {
      description: "Updated",
      content: {
        "application/json": {
          schema: z.object({
            data: NotificationSchema,
            success: z.literal(true),
            error: z.null(),
          }),
        },
      },
    },
    ...openApiErrorResponses,
  },
});

export default function registerPutWorkspaceNotifications(
  api: OpenAPIHono<{ Bindings: EnvBindings; Variables: ApiVariables }>
) {
  return api.openapi(route, async (c) => {
    const userId = c.get("userId");
    const { id: workspaceId } = c.req.valid("param");
    const body = c.req.valid("json");

    const { data: userMembership, error: userMembershipError } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", userId)
      .eq("invitation_status", "accepted")
      .single();

    if (
      userMembershipError ||
      !userMembership ||
      userMembership.role === "viewer"
    ) {
      throw new HTTPException(403, { message: "Insufficient permissions" });
    }

    const updateData = { ...body, updated_at: new Date().toISOString() };

    const { data: updatedConfig, error: updateError } = await supabase
      .from("notifications")
      .update(updateData)
      .eq("workspace_id", workspaceId)
      .select()
      .single();

    if (updateError) {
      throw new HTTPException(500, {
        message: "Failed to update notification configuration",
      });
    }

    return c.json({ data: updatedConfig, success: true, error: null });
  });
}
