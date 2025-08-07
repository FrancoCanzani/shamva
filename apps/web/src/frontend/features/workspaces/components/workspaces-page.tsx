import DashboardHeader from "@/frontend/components/dashboard-header";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/frontend/components/ui/avatar";
import { Badge } from "@/frontend/components/ui/badge";
import { Button } from "@/frontend/components/ui/button";
import { Route } from "@/frontend/routes/dashboard/workspaces";
import { Link, useRouteContext } from "@tanstack/react-router";

export default function WorkspacesPage() {
  const workspaces = Route.useLoaderData();
  const { auth } = useRouteContext({ from: "/dashboard" });

  const user = auth.user;
  const userName = user?.user_metadata?.name as string | undefined;
  const userEmail = user?.email as string | undefined;
  const userAvatarUrl = user?.user_metadata?.avatar_url as string | undefined;

  const userInitials = (userName || userEmail || "?")
    .split(" ")
    .map((part: string) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex h-full flex-col">
      <DashboardHeader>
        <Button asChild variant="outline" size="xs">
          <Link to="/dashboard/workspaces/new">New Workspace</Link>
        </Button>
      </DashboardHeader>
      <main className="mx-auto w-full max-w-4xl flex-1 space-y-8 p-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-medium">Workspaces</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Manage workspaces and team access across your organization.
            </p>
          </div>
        </div>

        {workspaces.length === 0 ? (
          <div className="space-y-2 border p-4 text-center text-sm">
            <p className="text-muted-foreground">
              No workspaces found. Create one to get started.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {workspaces.map((workspace) => {
              const members = workspace.workspace_members || [];

              return (
                <div
                  key={workspace.id}
                  className="space-y-4 rounded border p-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-medium">{workspace.name}</h2>
                      {workspace.description && (
                        <p className="text-muted-foreground mt-1 text-sm">
                          {workspace.description}
                        </p>
                      )}
                    </div>
                    <Button
                      asChild
                      variant="outline"
                      size="xs"
                      className="text-xs"
                    >
                      <Link
                        to="/dashboard/workspaces/$workspaceId"
                        params={{ workspaceId: workspace.id }}
                      >
                        Manage
                      </Link>
                    </Button>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="text-xs font-medium">Team Members</h3>
                      <span className="text-muted-foreground text-xs">
                        <span>{members.length}</span> total
                      </span>
                    </div>

                    {members.length === 0 ? (
                      <p className="text-muted-foreground text-xs">
                        No members yet.
                      </p>
                    ) : (
                      <div className="rounded border p-2">
                        {members.map((member, index) => (
                          <div
                            key={member.id}
                            className={`flex items-center justify-between gap-2 py-2 ${
                              index < members.length - 1 ? "border-b" : ""
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {user && member.user_id === user.id ? (
                                <Avatar className="h-6 w-6">
                                  <AvatarImage
                                    src={userAvatarUrl}
                                    alt={userName || userEmail}
                                  />
                                  <AvatarFallback className="text-[10px]">
                                    {userInitials}
                                  </AvatarFallback>
                                </Avatar>
                              ) : (
                                <div className="bg-muted h-6 w-6 rounded-full" />
                              )}
                              <div className="flex flex-col">
                                <span className="text-sm font-medium">
                                  {member.user_id === user?.id
                                    ? userName || userEmail || "You"
                                    : member.invitation_email ||
                                      "Unknown Email"}
                                </span>
                                <span className="text-muted-foreground text-xs capitalize">
                                  {member.user_id === user?.id ? "you • " : ""}
                                  {member.role} • {member.invitation_status}
                                </span>
                              </div>
                            </div>
                            <Badge
                              variant="secondary"
                              className="text-[10px] capitalize"
                            >
                              {member.role}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
