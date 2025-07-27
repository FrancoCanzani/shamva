import { QueryClient } from "@tanstack/react-query";
import {
  CatchBoundary,
  RouterProvider,
  createRouter,
} from "@tanstack/react-router";
import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { AuthProvider } from "./lib/context/auth-context";
import { supabase } from "./lib/supabase";
import { routeTree } from "./routeTree.gen";
import { useAuth } from "./hooks/use-auth";

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
  const auth = useAuth();

  return (
    <RouterProvider
      router={router}
      context={{
        queryClient,
        supabase,
        auth,
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
