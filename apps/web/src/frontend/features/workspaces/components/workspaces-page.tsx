import { Button } from "@/frontend/components/ui/button";
import { Separator } from "@/frontend/components/ui/separator";
import { Route } from "@/frontend/routes/dashboard/workspaces";
import { Link } from "@tanstack/react-router";

export default function WorkspacesPage() {
  const workspaces = Route.useLoaderData();

  return (
    <div className="container mx-auto max-w-4xl space-y-8 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-medium">Workspaces</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage workspaces and team access across your organization.
          </p>
        </div>
        <Button asChild variant={"outline"} size={"xs"}>
          <Link to="/dashboard/workspaces/new">New Workspace</Link>
        </Button>
      </div>

      <Separator />

      {workspaces.length === 0 ? (
        <div className="space-y-2 border p-6 text-center text-sm">
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
                className="space-y-4 border border-dashed p-4"
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
                  <h3 className="mb-2 text-xs font-medium">Team Members</h3>

                  {members.length === 0 ? (
                    <p className="text-muted-foreground text-xs">
                      No members yet.
                    </p>
                  ) : (
                    <div className="border border-dashed px-2 py-1.5">
                      {members.map((member, index) => (
                        <div
                          key={member.id}
                          className={`flex items-center justify-between gap-2 py-2 ${
                            index < members.length - 1
                              ? "border-b border-dashed"
                              : ""
                          }`}
                        >
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">
                              {member.invitation_email || "Unknown Email"}
                            </span>
                            <span className="text-muted-foreground text-xs capitalize">
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
