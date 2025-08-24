import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import type { EnvBindings } from "../../../../../../bindings";
import type { ApiVariables } from "../../../../lib/types";
import { supabase } from "../../../../lib/supabase/client";
import { HTTPException } from "hono/http-exception";
import { openApiErrorResponses } from "../../../../lib/utils";
import { UUIDParamSchema, NotificationSchema } from "../schemas";

const route = createRoute({
  method: "get",
  path: "/workspaces/:id/notifications",
  request: { params: UUIDParamSchema },
  responses: {
    200: {
      description: "OK",
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

export default function registerGetWorkspaceNotifications(
  api: OpenAPIHono<{ Bindings: EnvBindings; Variables: ApiVariables }>
) {
  return api.openapi(route, async (c) => {
    const userId = c.get("userId");
    const { id: workspaceId } = c.req.valid("param");

    const { data: membershipData, error: membershipError } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", userId)
      .eq("invitation_status", "accepted")
      .single();

    if (membershipError || !membershipData) {
      throw new HTTPException(403, { message: "Access denied to workspace" });
    }

    const { data: notificationsData, error: notificationsError } =
      await supabase
        .from("notifications")
        .select("*")
        .eq("workspace_id", workspaceId)
        .single();

    if (notificationsError) {
      if (notificationsError.code === "PGRST116") {
        const defaultConfig = {
          workspace_id: workspaceId,
          email_enabled: true,
        };
        const { data: newConfig, error: createError } = await supabase
          .from("notifications")
          .insert([defaultConfig])
          .select()
          .single();
        if (createError) {
          throw new HTTPException(500, {
            message: "Failed to create notification configuration",
          });
        }
        return c.json({ data: newConfig, success: true, error: null });
      }
      throw new HTTPException(500, {
        message: "Failed to fetch notification configuration",
      });
    }

    return c.json({ data: notificationsData, success: true, error: null });
  });
}
