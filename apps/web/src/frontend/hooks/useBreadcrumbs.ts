import { useRouterState } from "@tanstack/react-router";
import { useMemo } from "react";
import { z } from "zod";

export interface BreadcrumbItem {
  label: string;
  href?: string;
  isCurrentPage?: boolean;
}

const ROUTE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  monitors: "Monitors",
  heartbeats: "Heartbeats",
  incidents: "Incidents",
  logs: "Logs",
  collectors: "Collectors",
  notifications: "Notifications",
  "status-pages": "Status Pages",
  settings: "Settings",
  workspaces: "Workspaces",
  onboarding: "Onboarding",
  new: "New",
  edit: "Edit",
};

const EXCLUDED_ROUTES = ["__root"];

const isUUID = (str: string): boolean => {
  return z.uuid().safeParse(str).success;
};

export function useBreadcrumbs() {
  const routerState = useRouterState();

  const breadcrumbs = useMemo((): BreadcrumbItem[] => {
    const { location } = routerState;
    const pathSegments = location.pathname.split("/").filter(Boolean);

    if (pathSegments.length === 0) return [];

    const items: BreadcrumbItem[] = [];
    let currentPath = "";

    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === pathSegments.length - 1;

      if (EXCLUDED_ROUTES.includes(segment) || isUUID(segment)) {
        return;
      }

      const label =
        ROUTE_LABELS[segment] ||
        segment.charAt(0).toUpperCase() + segment.slice(1);

      const isWorkspaceSlug = index === 1 && pathSegments[0] === "dashboard";

      items.push({
        label,
        href:
          isLast || segment === "dashboard" || isWorkspaceSlug
            ? undefined
            : currentPath,
        isCurrentPage: isLast,
      });
    });

    return items;
  }, [routerState]);

  return breadcrumbs;
}
