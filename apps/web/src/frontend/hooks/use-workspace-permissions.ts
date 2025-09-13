import { useWorkspaces } from "./use-workspaces";
import { useRouteContext } from "@tanstack/react-router";
import { useMemo } from "react";

export type WorkspaceRole = "admin" | "member" | "viewer";

export function useWorkspacePermissions(workspaceSlug?: string) {
  const { currentWorkspace } = useWorkspaces(workspaceSlug);
  const { auth } = useRouteContext({ from: "/dashboard" });

  const userRole = useMemo(() => {
    if (!auth.user || !currentWorkspace?.workspace_members) {
      return null;
    }

    const member = currentWorkspace.workspace_members.find(
      (m) => m.user_id === auth.user!.id && m.invitation_status === "accepted"
    );

    return member?.role || null;
  }, [auth.user, currentWorkspace]);

  const permissions = useMemo(() => {
    if (!userRole) {
      return {
        canView: false,
        canEdit: false,
        canDelete: false,
        canManageMembers: false,
        canManageWorkspace: false,
      };
    }

    switch (userRole) {
      case "admin":
        return {
          canView: true,
          canEdit: true,
          canDelete: true,
          canManageMembers: true,
          canManageWorkspace: true,
        };
      case "member":
        return {
          canView: true,
          canEdit: true,
          canDelete: false,
          canManageMembers: false,
          canManageWorkspace: false,
        };
      default:
        return {
          canView: false,
          canEdit: false,
          canDelete: false,
          canManageMembers: false,
          canManageWorkspace: false,
        };
    }
  }, [userRole]);

  return {
    userRole,
    permissions,
    isAdmin: userRole === "admin",
    isMember: userRole === "member",
    hasAccess: !!userRole,
  };
}
