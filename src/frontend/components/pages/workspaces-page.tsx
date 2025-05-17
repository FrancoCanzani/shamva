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
          <Button asChild variant="outline" size="sm" className="mt-2">
            <Link to="/dashboard/workspaces/new">Create Workspace</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {workspaces.map((workspace) => {
            const members = workspace.workspace_members || [];

            return (
              <div key={workspace.id} className="space-y-6 rounded border p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-lg font-medium">{workspace.name}</h2>
                    {workspace.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {workspace.description}
                      </p>
                    )}
                  </div>
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="text-sm"
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
                  <h3 className="text-sm font-medium mb-4">Team Members</h3>

                  {members.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No members yet.
                    </p>
                  ) : (
                    <div className="rounded border p-2">
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">
                        {members.length} Members
                      </h3>
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
