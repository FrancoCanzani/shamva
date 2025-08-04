import NotFoundMessage from "@/frontend/components/not-found-message";
import { Button } from "@/frontend/components/ui/button";
import { Route } from "@/frontend/routes/dashboard/$workspaceName/status-pages";
import { StatusPage } from "@/frontend/types/types";
import { Link } from "@tanstack/react-router";

export default function StatusPagesPage() {
  const statusPages = Route.useLoaderData();
  const { workspaceName } = Route.useParams();

  return (
    <div className="space-y-8 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-medium">Status Pages</h2>
          <p className="text-muted-foreground mt-1 text-sm">
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
          {statusPages.map((statusPage: StatusPage) => (
            <div
              key={statusPage.id}
              className="border border-dashed p-4 hover:bg-stone-50"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{statusPage.title}</h3>
                    <span className="bg-muted px-2 py-1 text-xs">
                      /{statusPage.slug}
                    </span>
                  </div>
                  {statusPage.description && (
                    <p className="text-muted-foreground text-sm">
                      {statusPage.description}
                    </p>
                  )}
                  <div className="text-muted-foreground flex items-center gap-4 text-xs">
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
