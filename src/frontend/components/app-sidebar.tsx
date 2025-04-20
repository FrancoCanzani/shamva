import { Link } from "@tanstack/react-router";
import {
  ChartBarIcon,
  CogIcon,
  FolderIcon,
  LinkIcon,
  PlusCircleIcon,
  UsersIcon,
} from "lucide-react";

import { Button } from "./ui/button";

export function AppSidebar() {
  const navItems = [
    {
      href: "/dashboard/links",
      label: "Links",
      icon: <LinkIcon className="w-5 h-5" />,
    },
    {
      href: "/dashboard/campaigns",
      label: "Campaigns",
      icon: <FolderIcon className="w-5 h-5" />,
    },
    {
      href: "/dashboard/analytics",
      label: "Analytics",
      icon: <ChartBarIcon className="w-5 h-5" />,
    },
    {
      href: "/dashboard/users",
      label: "Team",
      icon: <UsersIcon className="w-5 h-5" />,
    },
    {
      href: "/dashboard/settings",
      label: "Settings",
      icon: <CogIcon className="w-5 h-5" />,
    },
  ];

  return (
    <aside className="flex flex-col h-screen w-64 border-r bg-background text-foreground">
      <div className="p-4 border-b">
        <h1 className="text-xl font-bold">Blinks</h1>
      </div>

      <div className="p-4">
        <Button className="w-full">
          <PlusCircleIcon className="w-5 h-5 mr-2" />
          Create Link
        </Button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-2">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                to={item.href}
                className="flex items-center gap-3 px-3 py-2 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors data-[active=true]:bg-muted data-[active=true]:text-foreground"
                activeProps={{ "data-active": true }}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t">
        <div className="flex items-center gap-3">
          <p className="font-medium">John Doe</p>
          <p className="text-sm text-muted-foreground">john@example.com</p>
        </div>
      </div>
    </aside>
  );
}
