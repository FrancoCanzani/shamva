import {
  CatchBoundary,
  RouterProvider,
  createRouter,
} from "@tanstack/react-router";
import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import Loading from "./components/loading";
import { useAuth } from "./hooks/use-auth";
import { AuthProvider } from "./lib/context/auth-context";
import { routeTree } from "./routeTree.gen";

export const router = createRouter({
  routeTree,
  context: {
    auth: undefined!,
  },
  defaultPreload: "intent",
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

function AppWithRouter() {
  const { user, session, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return <Loading />;
  }

  return (
    <RouterProvider
      router={router}
      context={{
        auth: {
          user,
          session,
          isLoading,
          isAuthenticated,
        },
      }}
    />
  );
}

const rootElement = document.getElementById("root")!;
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <CatchBoundary getResetKey={() => window.location.pathname}>
        <AuthProvider>
          <AppWithRouter />
        </AuthProvider>
      </CatchBoundary>
    </StrictMode>
  );
}
