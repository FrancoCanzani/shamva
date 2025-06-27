import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { useParams } from "@tanstack/react-router";

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
  }
];

export default function MonitorTypeSelector() {
  const { workspaceName } = useParams({ strict: false });

  const [isOpen, setIsOpen] = useState(false);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger >
        <Button variant={"outline"} size={"xs"}>
            New Monitor
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0">
        <div className="p-2 border-b">
          <h3 className="font-medium text-sm">Select Monitor Type</h3>
          <p className="text-xs text-muted-foreground">
            Choose the type of monitoring you want
          </p>
        </div>
        <div className="p-2 space-y-2">
          {monitorTypes.map((monitorType) => {
            return (
              <Link
                key={monitorType.type}
                to="/dashboard/$workspaceName/monitors/new/$type"
                params={{ 
                  workspaceName: workspaceName!,
                  type: monitorType.type
                }}
                onClick={() => setIsOpen(false)}
                className="block"
              >
                <Card className="hover:bg-carbon-50 hover:dark:bg-carbon-800 transition-colors cursor-pointer border shadow-xs rounded-xs">
                  <CardHeader className="p-1">
                    <CardTitle className="text-sm font-medium">{monitorType.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs text-muted-foreground p-1">
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