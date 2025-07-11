import { Link, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

const monitorTypes = [
  {
    type: "http",
    title: "HTTP/HTTPS Check",
    description: "Monitor web endpoints, APIs, and websites",
  },
  {
    type: "tcp",
    title: "TCP Check",
    description: "Monitor raw TCP connections and services",
  },
];

export default function MonitorTypeSelector() {
  const { workspaceName } = useParams({ strict: false });

  const [isOpen, setIsOpen] = useState(false);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger>
        <Button variant={"outline"} size={"xs"} className="rounded">
          New Monitor
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0">
        <div className="border-b p-2">
          <h3 className="text-sm font-medium">Select Monitor Type</h3>
        </div>
        <div className="space-y-2 p-2">
          {monitorTypes.map((monitorType) => {
            return (
              <Link
                key={monitorType.type}
                to="/dashboard/$workspaceName/monitors/new/$type"
                params={{
                  workspaceName: workspaceName!,
                  type: monitorType.type,
                }}
                onClick={() => setIsOpen(false)}
                className="block"
              >
                <Card className="hover:bg-carbon-50 hover:dark:bg-carbon-800 cursor-pointer rounded-md border shadow-xs transition-colors">
                  <CardHeader className="p-1">
                    <CardTitle className="text-xs font-medium">
                      {monitorType.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-muted-foreground px-1 pb-1 text-xs">
                    {monitorType.description}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
