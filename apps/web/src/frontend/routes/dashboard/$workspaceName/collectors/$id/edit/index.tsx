import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/dashboard/$workspaceName/collectors/$id/edit/"
)({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/dashboard/$workspaceName/collectors/$id/edit/"!</div>;
}
