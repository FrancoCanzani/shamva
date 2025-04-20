import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/links/$slug/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { slug } = Route.useParams();

  return <div>{`Hello "/dashboard/links/${slug}"!`}</div>;
}
