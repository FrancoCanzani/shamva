import MonitorPage from "@/frontend/components/pages/monitor-page";
import fetchMonitor from "@/frontend/lib/loaders/monitor";
import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/monitors/$id/")({
  component: MonitorPage,
  loader: ({ params, abortController }) =>
    fetchMonitor({ params, abortController }),
  errorComponent: ({ error }) => {
    if (error instanceof Error && error.message.includes("not found")) {
      return (
        <div className="p-4 text-center text-muted-foreground">
          Monitor not found.{" "}
          <Link to="/dashboard/monitors" className="text-primary underline">
            Go back
          </Link>
        </div>
      );
    }
    return (
      <div className="p-4 text-center text-red-600">
        An unexpected error occurred: {String(error?.message || error)}
      </div>
    );
  },
});
