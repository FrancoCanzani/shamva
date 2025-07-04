import { useWorkspaces } from "./use-workspaces";
import { useAuth } from "../lib/context/auth-context";
import { useMemo } from "react";

export type WorkspaceRole = "admin" | "member" | "viewer";

export function useWorkspacePermissions(workspaceName?: string) {
  const { currentWorkspace } = useWorkspaces(workspaceName);
  const { user } = useAuth();

  const userRole = useMemo(() => {
    if (!user || !currentWorkspace?.workspace_members) {
      return null;
    }

    const member = currentWorkspace.workspace_members.find(
      (m) => m.user_id === user.id && m.invitation_status === "accepted"
    );

    return member?.role || null;
  }, [user, currentWorkspace]);

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
      case "viewer":
        return {
          canView: true,
          canEdit: false,
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
    isViewer: userRole === "viewer",
    hasAccess: !!userRole,
  };
}
