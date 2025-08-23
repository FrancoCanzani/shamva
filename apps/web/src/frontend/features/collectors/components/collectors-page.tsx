import DashboardHeader from "@/frontend/components/dashboard-header";
import { Button } from "@/frontend/components/ui/button";
import { Route } from "@/frontend/routes/dashboard/$workspaceName/collectors";
import { Link } from "@tanstack/react-router";

export default function CollectorsPage() {
  const { workspaceName } = Route.useParams();

  return (
    <div className="flex h-full flex-col">
      <DashboardHeader title={`Dashboard / ${workspaceName} / Collectors`}>
        <Button asChild variant={"outline"} size={"xs"}>
          <Link
            params={{ workspaceName: workspaceName }}
            to="/dashboard/$workspaceName/collectors/new"
          >
            New Collector
          </Link>
        </Button>
      </DashboardHeader>
      <main className="mx-auto w-full max-w-4xl flex-1 space-y-8 overflow-auto p-6">
        <div className="mb-6">
          <h2 className="text-xl font-medium">Collectors</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            A Monitor is a silent vigilante of your services.
          </p>
        </div>
      </main>
    </div>
  );
}
