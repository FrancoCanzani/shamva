import { QueryClient } from "@tanstack/react-query";
import {
  CatchBoundary,
  RouterProvider,
  createRouter,
} from "@tanstack/react-router";
import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { useAuth } from "./hooks/use-auth";
import { AuthProvider } from "./lib/context/auth-context";
import supabase from "./lib/supabase";
import { routeTree } from "./routeTree.gen";

const queryClient = new QueryClient();

export const router = createRouter({
  routeTree,
  context: {
    queryClient,
    supabase,
    auth: undefined!,
  },
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

function AppWithRouter() {
  const { user, session, isLoading, signOut } = useAuth();

  return (
    <RouterProvider
      router={router}
      context={{
        queryClient,
        supabase,
        auth: {
          user,
          session,
          isLoading,
          signOut,
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
