import type { Log } from "@/frontend/lib/types";
import type { Table } from "@tanstack/react-table";
import { format } from "date-fns";
import { CalendarIcon, ChevronDown, ChevronRight, X } from "lucide-react";
import * as React from "react";
import { useCallback, useEffect, useMemo } from "react";
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

  const uniqueStatusCodes = useMemo(() => {
    const codes = new Set(data.map((log) => log.status_code));
    return Array.from(codes).sort((a, b) => a - b);
  }, [data]);

  const uniqueMethods = useMemo(() => {
    const methods = new Set(data.map((log) => log.method));
    return Array.from(methods).sort();
  }, [data]);

  const uniqueRegions = useMemo(() => {
    const regions = new Set(data.map((log) => log.region).filter(Boolean));
    return Array.from(regions).sort();
  }, [data]);

  const statusCodeCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    data.forEach((log) => {
      counts[log.status_code] = (counts[log.status_code] || 0) + 1;
    });
    return counts;
  }, [data]);

  const methodCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    data.forEach((log) => {
      counts[log.method] = (counts[log.method] || 0) + 1;
    });
    return counts;
  }, [data]);

  const regionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    data.forEach((log) => {
      if (log.region) {
        counts[log.region] = (counts[log.region] || 0) + 1;
      }
    });
    return counts;
  }, [data]);

  const urlFilter = table.getColumn("url")?.getFilterValue() as string;

  const applyDateFilter = useCallback(() => {
    const column = table.getColumn("created_at");
    if (!column) return;

    if (dateFrom || dateTo) {
      column.setFilterValue({
        from: dateFrom,
        to: dateTo,
      });
    } else {
      column.setFilterValue(undefined);
    }
  }, [dateFrom, dateTo, table]);

  useEffect(() => {
    applyDateFilter();
  }, [applyDateFilter]);

  const applyLatencyFilter = useCallback(() => {
    const column = table.getColumn("latency");
    if (!column) return;

    const min = minLatency ? Number.parseInt(minLatency, 10) : undefined;
    const max = maxLatency ? Number.parseInt(maxLatency, 10) : undefined;

    if (min !== undefined || max !== undefined) {
      column.setFilterValue({
        min: min ?? 0,
        max: max ?? Number.POSITIVE_INFINITY,
      });
    } else {
      column.setFilterValue(undefined);
    }
  }, [minLatency, maxLatency, table]);

  useEffect(() => {
    applyLatencyFilter();
  }, [applyLatencyFilter]);

  const applyStatusCodeFilter = useCallback(() => {
    const column = table.getColumn("status_code");
    if (!column) return;

    if (selectedStatusCodes.size > 0) {
      column.setFilterValue(Array.from(selectedStatusCodes));
    } else {
      column.setFilterValue(undefined);
    }
  }, [selectedStatusCodes, table]);

  useEffect(() => {
    applyStatusCodeFilter();
  }, [applyStatusCodeFilter]);

  const applyMethodFilter = useCallback(() => {
    const column = table.getColumn("method");
    if (!column) return;

    if (selectedMethods.size > 0) {
      column.setFilterValue(Array.from(selectedMethods));
    } else {
      column.setFilterValue(undefined);
    }
  }, [selectedMethods, table]);

  useEffect(() => {
    applyMethodFilter();
  }, [applyMethodFilter]);

  const applyRegionFilter = useCallback(() => {
    const column = table.getColumn("region");
    if (!column) return;

    if (selectedRegions.size > 0) {
      column.setFilterValue(Array.from(selectedRegions));
    } else {
      column.setFilterValue(undefined);
    }
  }, [selectedRegions, table]);

  useEffect(() => {
    applyRegionFilter();
  }, [applyRegionFilter]);

  const clearFilters = useCallback(() => {
    table.resetColumnFilters();
    setDateFrom(undefined);
    setDateTo(undefined);
    setMinLatency("");
    setMaxLatency("");
    setSelectedStatusCodes(new Set());
    setSelectedMethods(new Set());
    setSelectedRegions(new Set());
  }, [table]);

  const hasActiveFilters = table.getState().columnFilters.length > 0;

  const formatCount = useCallback((count: number) => {
    if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
    return count.toString();
  }, []);

  const handleStatusCodeChange = useCallback(
    (statusCode: number, checked: boolean) => {
      setSelectedStatusCodes((prev) => {
        const newSelected = new Set(prev);
        if (checked) {
          newSelected.add(statusCode);
        } else {
          newSelected.delete(statusCode);
        }
        return newSelected;
      });
    },
    [],
  );

  const handleMethodChange = useCallback((method: string, checked: boolean) => {
    setSelectedMethods((prev) => {
      const newSelected = new Set(prev);
      if (checked) {
        newSelected.add(method);
      } else {
        newSelected.delete(method);
      }
      return newSelected;
    });
  }, []);

  const handleRegionChange = useCallback((region: string, checked: boolean) => {
    setSelectedRegions((prev) => {
      const newSelected = new Set(prev);
      if (checked) {
        newSelected.add(region);
      } else {
        newSelected.delete(region);
      }
      return newSelected;
    });
  }, []);

  const handleUrlFilterChange = useCallback(
    (value: string) => {
      const column = table.getColumn("url");
      if (column) {
        column.setFilterValue(value || undefined);
      }
    },
    [table],
  );

  return (
    <div className="w-80 border-r bg-background">
      <div className="border-b border-dashed">
        <div className="flex items-center justify-between h-12 p-4">
          <h2 className="font-medium">Filters</h2>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
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
                  className="flex items-center justify-between w-full h-auto p-2"
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
                  className="flex items-center justify-between w-full h-auto p-2"
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
                      handleUrlFilterChange(event.target.value)
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
                          handleStatusCodeChange(statusCode, Boolean(checked))
                        }
                      />
                      <Label
                        htmlFor={`status-${statusCode}`}
                        className="text-sm flex-1 cursor-pointer"
                      >
                        {statusCode === -1 ? "ERR" : statusCode}
                      </Label>
                      <span className="text-xs text-muted-foreground font-medium">
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
                          handleMethodChange(method, Boolean(checked))
                        }
                      />
                      <Label
                        htmlFor={`method-${method}`}
                        className="text-sm flex-1 cursor-pointer"
                      >
                        {method}
                      </Label>
                      <span className="text-xs text-muted-foreground font-medium">
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
                          handleRegionChange(region, Boolean(checked))
                        }
                      />
                      <Label
                        htmlFor={`region-${region}`}
                        className="text-sm flex-1 cursor-pointer"
                      >
                        {getRegionNameFromCode(region) || region}
                      </Label>
                      <span className="text-xs text-muted-foreground font-medium">
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
                          min="0"
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
                          min="0"
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
