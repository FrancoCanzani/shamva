import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/dashboard/$workspaceSlug/collectors/$id/edit/"
)({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/dashboard/$workspaceSlug/collectors/$id/edit/"!</div>;
}
