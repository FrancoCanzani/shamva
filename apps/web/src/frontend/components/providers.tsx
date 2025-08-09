import { QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";
import { Toaster } from "sonner";
import { ThemeProvider } from "../lib/context/theme-context";
import { WorkspaceProvider } from "../lib/context/workspace-context";
import { SidebarProvider } from "./ui/sidebar";
import { queryClient } from "../lib/query-client";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider>
      <SidebarProvider>
        <QueryClientProvider client={queryClient}>
          <WorkspaceProvider>
            {children}
            <Toaster />
          </WorkspaceProvider>
        </QueryClientProvider>
      </SidebarProvider>
    </ThemeProvider>
  );
}
