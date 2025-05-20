import { useWorkspaces } from "@/frontend/hooks/use-workspaces";
import { useAuth } from "@/frontend/lib/context/auth-context";
import { Link } from "@tanstack/react-router";
import { Button } from "../ui/button";

export default function IndexPage() {
  const { user, isLoading: authLoading, signOut } = useAuth();
  const { workspaces, isLoading: workspacesLoading } = useWorkspaces();

  const name =
    user &&
    user.identities &&
    user.identities[0] &&
    user.identities[0].identity_data &&
    user.identities[0].identity_data.full_name;

  // Determine the correct link destination based on auth and workspaces
  let dashboardLinkTo = "/auth/login"; // Default if not logged in
  if (!authLoading && user) {
    if (workspacesLoading) {
      dashboardLinkTo = "#";
    } else if (workspaces && workspaces.length > 0) {
      const firstworkspaceName = workspaces[0].name;
      dashboardLinkTo = `/dashboard/${firstworkspaceName}/monitors`;
    } else {
      dashboardLinkTo = "/dashboard/workspaces/new";
    }
  }

  return (
    <div className="w-full mx-auto gap-6 flex flex-col p-4">
      <header className="w-full flex items-center justify-between space-x-2">
        {!authLoading && user ? name : <Link to="/auth/login">Login</Link>}
        <Link
          to={dashboardLinkTo}
          aria-disabled={!user || workspacesLoading}
          className={
            !user || workspacesLoading ? "pointer-events-none opacity-50" : ""
          }
        >
          Dashboard
          {workspacesLoading && "..."}
        </Link>
        {!authLoading && user && (
          <Button variant={"outline"} size={"sm"} onClick={signOut}>
            Sign Out
          </Button>
        )}
      </header>
      <div className="w-full max-w-xl mx-auto gap-6 flex flex-col py-8 px-4">
        <div className="text-center space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Blinks</h1>
        </div>
      </div>
    </div>
  );
}
