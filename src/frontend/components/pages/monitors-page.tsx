import { Route } from "@/frontend/routes/dashboard/$workspaceName/monitors";
import { Link } from "@tanstack/react-router";
import { MonitorsTable } from "../monitors/monitors-table";
import { Button } from "../ui/button";

export default function MonitorsPage() {
  const monitorsData = Route.useLoaderData();

  const { workspaceName } = Route.useParams();

  return (
    <div className="p-4 space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="font-medium text-xl">Monitors</h2>
        <Button asChild variant={"outline"} size={"xs"}>
          <Link
            to="/dashboard/$workspaceName/monitors/new"
            params={{ workspaceName: workspaceName }}
          >
            New
          </Link>
        </Button>
      </div>
      <MonitorsTable monitors={monitorsData} />
    </div>
  );
}
