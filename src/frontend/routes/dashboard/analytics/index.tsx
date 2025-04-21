import { AnalyticsDataTable } from "@/frontend/components/analytics-data-table";
import { fetchAnalytics } from "@/frontend/lib/loaders/analytics";
import { LinkAnalytic } from "@/frontend/lib/types";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/analytics/")({
  loader: ({ abortController }) => fetchAnalytics({ abortController }),
  component: RouteComponent,
});

function RouteComponent() {
  const analyticsData = Route.useLoaderData() as LinkAnalytic[];

  console.log(analyticsData);

  return (
    <div className="">
      <h1 className="text-sm font-medium mb-4 p-4">Link Analytics</h1>
      <AnalyticsDataTable data={analyticsData} />
    </div>
  );
}
