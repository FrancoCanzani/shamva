import type { Log } from "@/frontend/lib/types";
import type { Table } from "@tanstack/react-table";
import { format } from "date-fns";
import { CalendarIcon, ChevronDown, ChevronRight, X } from "lucide-react";
import * as React from "react";
import { useEffect } from "react";
import { getRegionNameFromCode } from "../lib/utils";
import { Button } from "./ui/button";
import { Calendar } from "./ui/calendar";
import { Checkbox } from "./ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";

interface LogsFiltersSidebarProps {
  table: Table<Log>;
  data: Log[];
}

export function LogsDataTableFiltersSidebar({
  table,
  data,
}: LogsFiltersSidebarProps) {
  const [dateFrom, setDateFrom] = React.useState<Date>();
  const [dateTo, setDateTo] = React.useState<Date>();
  const [minLatency, setMinLatency] = React.useState<string>("");
  const [maxLatency, setMaxLatency] = React.useState<string>("");
  const [selectedStatusCodes, setSelectedStatusCodes] = React.useState<
    Set<number>
  >(new Set());
  const [selectedMethods, setSelectedMethods] = React.useState<Set<string>>(
    new Set(),
  );
  const [selectedRegions, setSelectedRegions] = React.useState<Set<string>>(
    new Set(),
  );

  const [timeRangeOpen, setTimeRangeOpen] = React.useState(true);
  const [urlOpen, setUrlOpen] = React.useState(true);
  const [statusOpen, setStatusOpen] = React.useState(true);
  const [methodOpen, setMethodOpen] = React.useState(true);
  const [regionOpen, setRegionOpen] = React.useState(true);
  const [latencyOpen, setLatencyOpen] = React.useState(true);

  const uniqueStatusCodes = React.useMemo(() => {
    const codes = new Set(data.map((log) => log.status_code));
    return Array.from(codes).sort((a, b) => a - b);
  }, [data]);

  const uniqueMethods = React.useMemo(() => {
    const methods = new Set(data.map((log) => log.method));
    return Array.from(methods).sort();
  }, [data]);

  const uniqueRegions = React.useMemo(() => {
    const regions = new Set(data.map((log) => log.region).filter(Boolean));
    return Array.from(regions).sort();
  }, [data]);

  const statusCodeCounts = React.useMemo(() => {
    const counts: Record<number, number> = {};
    data.forEach((log) => {
      counts[log.status_code] = (counts[log.status_code] || 0) + 1;
    });
    return counts;
  }, [data]);

  const methodCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    data.forEach((log) => {
      counts[log.method] = (counts[log.method] || 0) + 1;
    });
    return counts;
  }, [data]);

  const regionCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    data.forEach((log) => {
      if (log.region) {
        counts[log.region] = (counts[log.region] || 0) + 1;
      }
    });
    return counts;
  }, [data]);

  const urlFilter = table.getColumn("url")?.getFilterValue() as string;

  useEffect(() => {
    if (dateFrom || dateTo) {
      table.getColumn("created_at")?.setFilterValue([dateFrom, dateTo]);
    } else {
      table.getColumn("created_at")?.setFilterValue(undefined);
    }
  }, [dateFrom, dateTo, table]);

  React.useEffect(() => {
    const min = minLatency ? Number.parseInt(minLatency) : undefined;
    const max = maxLatency ? Number.parseInt(maxLatency) : undefined;

    if (min !== undefined || max !== undefined) {
      table
        .getColumn("latency")
        ?.setFilterValue([min || 0, max || Number.POSITIVE_INFINITY]);
    } else {
      table.getColumn("latency")?.setFilterValue(undefined);
    }
  }, [minLatency, maxLatency, table]);

  useEffect(() => {
    if (selectedStatusCodes.size > 0) {
      table
        .getColumn("status_code")
        ?.setFilterValue(Array.from(selectedStatusCodes));
    } else {
      table.getColumn("status_code")?.setFilterValue(undefined);
    }
  }, [selectedStatusCodes, table]);

  useEffect(() => {
    if (selectedMethods.size > 0) {
      table.getColumn("method")?.setFilterValue(Array.from(selectedMethods));
    } else {
      table.getColumn("method")?.setFilterValue(undefined);
    }
  }, [selectedMethods, table]);

  useEffect(() => {
    if (selectedRegions.size > 0) {
      table.getColumn("region")?.setFilterValue(Array.from(selectedRegions));
    } else {
      table.getColumn("region")?.setFilterValue(undefined);
    }
  }, [selectedRegions, table]);

  const clearFilters = () => {
    table.resetColumnFilters();
    setDateFrom(undefined);
    setDateTo(undefined);
    setMinLatency("");
    setMaxLatency("");
    setSelectedStatusCodes(new Set());
    setSelectedMethods(new Set());
    setSelectedRegions(new Set());
  };

  const hasActiveFilters = table.getState().columnFilters.length > 0;

  const formatCount = (count: number) => {
    if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
    return count.toString();
  };

  const handleStatusCodeChange = (statusCode: number, checked: boolean) => {
    const newSelected = new Set(selectedStatusCodes);
    if (checked) {
      newSelected.add(statusCode);
    } else {
      newSelected.delete(statusCode);
    }
    setSelectedStatusCodes(newSelected);
  };

  const handleMethodChange = (method: string, checked: boolean) => {
    const newSelected = new Set(selectedMethods);
    if (checked) {
      newSelected.add(method);
    } else {
      newSelected.delete(method);
    }
    setSelectedMethods(newSelected);
  };

  const handleRegionChange = (region: string, checked: boolean) => {
    const newSelected = new Set(selectedRegions);
    if (checked) {
      newSelected.add(region);
    } else {
      newSelected.delete(region);
    }
    setSelectedRegions(newSelected);
  };

  return (
    <div className="w-80 border-r bg-background">
      <div className="border-b border-dashed">
        <div className="flex items-center justify-between h-12 p-4">
          <h2 className="font-medium">Filters</h2>
          {hasActiveFilters && (
            <Button variant="ghost" size="xs" onClick={clearFilters}>
              Clear all
              <X className="ml-1 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-80px)]">
        <div className="p-2 space-y-2">
          <div>
            <Collapsible open={timeRangeOpen} onOpenChange={setTimeRangeOpen}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center justify-between w-full h-auto"
                >
                  <span className="font-medium">Time Range</span>
                  {timeRangeOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="space-y-3 p-2">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">
                      From
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-sm font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateFrom
                            ? format(dateFrom, "MMM dd, yyyy")
                            : "Start date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={dateFrom}
                          onSelect={setDateFrom}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">To</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-sm font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateTo ? format(dateTo, "MMM dd, yyyy") : "End date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={dateTo}
                          onSelect={setDateTo}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>

          <Separator />

          <div>
            <Collapsible open={urlOpen} onOpenChange={setUrlOpen}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center justify-between w-full h-auto"
                >
                  <span className="font-medium">URL</span>
                  {urlOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-2 px-2 w-full">
                  <Input
                    placeholder="Filter URLs..."
                    value={urlFilter || ""}
                    onChange={(event) =>
                      table
                        .getColumn("url")
                        ?.setFilterValue(event.target.value || undefined)
                    }
                    className="w-full text-sm"
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>

          <Separator />

          <div>
            <Collapsible open={statusOpen} onOpenChange={setStatusOpen}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center justify-between w-full p-2 h-auto"
                >
                  <span className="font-medium">Status Code</span>
                  {statusOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="space-y-2 mt-2 p-2">
                  {uniqueStatusCodes.map((statusCode) => (
                    <div
                      key={statusCode}
                      className="flex items-center space-x-3"
                    >
                      <Checkbox
                        id={`status-${statusCode}`}
                        checked={selectedStatusCodes.has(statusCode)}
                        onCheckedChange={(checked) =>
                          handleStatusCodeChange(statusCode, checked as boolean)
                        }
                      />
                      <Label
                        htmlFor={`status-${statusCode}`}
                        className="text-sm flex-1"
                      >
                        {statusCode === -1 ? "ERR" : statusCode}
                      </Label>
                      <span className="text-sm font-medium">
                        {formatCount(statusCodeCounts[statusCode] || 0)}
                      </span>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>

          <Separator />

          <div>
            <Collapsible open={methodOpen} onOpenChange={setMethodOpen}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center justify-between w-full p-2 h-auto"
                >
                  <span className="font-medium">Method</span>
                  {methodOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="space-y-2 mt-2 p-2">
                  {uniqueMethods.map((method) => (
                    <div key={method} className="flex items-center space-x-3">
                      <Checkbox
                        id={`method-${method}`}
                        checked={selectedMethods.has(method)}
                        onCheckedChange={(checked) =>
                          handleMethodChange(method, checked as boolean)
                        }
                      />
                      <Label
                        htmlFor={`method-${method}`}
                        className="text-sm flex-1"
                      >
                        {method}
                      </Label>
                      <span className="text-sm font-medium">
                        {formatCount(methodCounts[method] || 0)}
                      </span>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>

          <Separator />

          <div>
            <Collapsible open={regionOpen} onOpenChange={setRegionOpen}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center justify-between w-full p-2 h-auto"
                >
                  <span className="font-medium">Region</span>
                  {regionOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="space-y-2 mt-2 p-2">
                  {uniqueRegions.map((region) => (
                    <div key={region} className="flex items-center space-x-3">
                      <Checkbox
                        id={`region-${region}`}
                        checked={selectedRegions.has(region)}
                        onCheckedChange={(checked) =>
                          handleRegionChange(region, checked as boolean)
                        }
                      />
                      <Label
                        htmlFor={`region-${region}`}
                        className="text-sm flex-1"
                      >
                        {getRegionNameFromCode(region) || region}
                      </Label>
                      <span className="text-sm font-medium">
                        {formatCount(regionCounts[region] || 0)}
                      </span>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>

          <Separator />

          <div>
            <Collapsible open={latencyOpen} onOpenChange={setLatencyOpen}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center justify-between w-full p-2 h-auto"
                >
                  <span className="font-medium">Latency</span>
                  {latencyOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="space-y-2 mt-2 p-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">
                        Min.
                      </Label>
                      <div className="flex items-center space-x-1">
                        <Input
                          type="number"
                          placeholder="0"
                          value={minLatency}
                          onChange={(e) => setMinLatency(e.target.value)}
                          className="text-sm"
                        />
                        <span className="text-xs text-muted-foreground">
                          ms
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">
                        Max.
                      </Label>
                      <div className="flex items-center space-x-1">
                        <Input
                          type="number"
                          placeholder="1000"
                          value={maxLatency}
                          onChange={(e) => setMaxLatency(e.target.value)}
                          className="text-sm"
                        />
                        <span className="text-xs text-muted-foreground">
                          ms
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
