import { Route } from "@/frontend/routes/dashboard/$workspaceName/status-pages";
import { Link } from "@tanstack/react-router";
import NotFoundMessage from "../not-found-message";
import { Button } from "../ui/button";

export default function StatusPagesPage() {
  const statusPages = Route.useLoaderData();
  const { workspaceName } = Route.useParams();

  return (
    <div className="p-4 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-medium text-xl">Status Pages</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Create public status pages to share the health of your services
          </p>
        </div>
        <Button asChild variant={"outline"} size={"xs"}>
          <Link
            to="/dashboard/$workspaceName/status-pages/new"
            params={{ workspaceName: workspaceName }}
          >
            New Status Page
          </Link>
        </Button>
      </div>

      {statusPages.length === 0 ? (
        <NotFoundMessage message="No status pages found. Create one to get started." />
      ) : (
        <div className="space-y-4">
          {statusPages.map((statusPage) => (
            <div
              key={statusPage.id}
              className="border rounded border-dashed p-4 hover:bg-slate-50"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{statusPage.title}</h3>
                    <span className="text-xs bg-muted px-2 py-1 rounded">
                      /{statusPage.slug}
                    </span>
                  </div>
                  {statusPage.description && (
                    <p className="text-sm text-muted-foreground">
                      {statusPage.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{statusPage.monitors.length} monitor(s)</span>
                    {statusPage.password && <span>Password protected</span>}
                    <span>{statusPage.is_public ? "Public" : "Private"}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button asChild variant="outline" size="xs">
                    <Link
                      to="/dashboard/$workspaceName/status-pages/$id/edit"
                      params={{
                        workspaceName: workspaceName,
                        id: statusPage.id,
                      }}
                    >
                      Edit
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="xs">
                    <a
                      href={`/status/${statusPage.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
