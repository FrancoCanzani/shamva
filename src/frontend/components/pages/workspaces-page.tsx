import { Route } from "@/frontend/routes/dashboard/workspaces";
import { Link } from "@tanstack/react-router";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";

export default function WorkspacesPage() {
  const workspaces = Route.useLoaderData();

  return (
    <div className="container max-w-4xl mx-auto p-4 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-medium">Workspaces</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage workspaces and team access across your organization.
          </p>
        </div>
        <Link to="/dashboard/workspaces/new">New</Link>
      </div>

      <Separator />

      {workspaces.length === 0 ? (
        <div className="rounded border p-6 text-center space-y-2">
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
                className="space-y-4 rounded border border-dashed p-4"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="font-medium">{workspace.name}</h2>
                    {workspace.description && (
                      <p className="text-sm text-muted-foreground mt-1">
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
                  <h3 className="text-xs font-medium mb-2">Team Members</h3>

                  {members.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      No members yet.
                    </p>
                  ) : (
                    <div className="rounded border-dashed border px-2 py-1.5">
                      {members.map((member, index) => (
                        <div
                          key={member.id}
                          className={`flex py-2 items-center justify-between gap-2 ${
                            index < members.length - 1
                              ? "border-b border-dashed"
                              : ""
                          }`}
                        >
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">
                              {member.invitation_email || "Unknown Email"}
                            </span>
                            <span className="text-xs text-muted-foreground capitalize">
                              {member.role} • {member.invitation_status}
                            </span>
                          </div>
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
    </div>
  );
}
