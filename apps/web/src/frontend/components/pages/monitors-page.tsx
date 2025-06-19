import { Route } from "@/frontend/routes/dashboard/$workspaceName/monitors";
import { Link } from "@tanstack/react-router";
import { MonitorsTable } from "../monitors/monitors-table";
import NotFoundMessage from "../not-found-message";
import { Button } from "../ui/button";

export default function MonitorsPage() {
  const monitorsData = Route.useLoaderData();

  const { workspaceName } = Route.useParams();

  return (
    <div className="p-4 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-medium text-xl">Monitors</h2>
          <p className="text-sm text-muted-foreground mt-1">
            A Monitor is a silent vigilante of your services
          </p>
        </div>
        <Button asChild variant={"outline"} size={"xs"}>
          <Link
            to="/dashboard/$workspaceName/monitors/new"
            params={{ workspaceName: workspaceName }}
          >
            New Monitor
          </Link>
        </Button>
      </div>
      {monitorsData && monitorsData.length > 0 ? (
        <MonitorsTable monitors={monitorsData} />
      ) : (
        <NotFoundMessage message="No monitors found. Create one to get started." />
      )}
    </div>
  );
}
