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
  return <div>Hello "/dashboard/analytics/"!</div>;
}
