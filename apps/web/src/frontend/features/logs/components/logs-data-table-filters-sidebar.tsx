import { Button } from "@/frontend/components/ui/button";
import { Calendar } from "@/frontend/components/ui/calendar";
import { Checkbox } from "@/frontend/components/ui/checkbox";
import { Input } from "@/frontend/components/ui/input";
import { Label } from "@/frontend/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/frontend/components/ui/popover";
import { ScrollArea } from "@/frontend/components/ui/scroll-area";
import { Separator } from "@/frontend/components/ui/separator";
import { Log } from "@/frontend/types/types";
import { getRegionNameFromCode } from "@/frontend/utils/utils";
import type { Table } from "@tanstack/react-table";
import { format } from "date-fns";
import { CalendarIcon, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

interface FilterGroup {
  key: string;
  label: string;
  values: Array<{
    value: string | number | boolean;
    label: string;
    count: number;
  }>;
}

interface LogsFiltersSidebarProps {
  table: Table<Log>;
  data: Log[];
}

export function LogsFiltersSidebar({ table, data }: LogsFiltersSidebarProps) {
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [latencyRange, setLatencyRange] = useState({ min: "", max: "" });
  const [urlFilter, setUrlFilter] = useState("");

  const filterGroups: FilterGroup[] = useMemo(() => {
    const statusCodes = new Map<string, number>();
    const methods = new Map<string, number>();
    const regions = new Map<string, number>();

    data.forEach((log) => {
      const statusKey =
        typeof log.ok === "boolean" ? (log.ok ? "OK" : "ERR") : "ERR";
      statusCodes.set(statusKey, (statusCodes.get(statusKey) || 0) + 1);
      methods.set(log.method, (methods.get(log.method) || 0) + 1);
      if (log.region) {
        regions.set(log.region, (regions.get(log.region) || 0) + 1);
      }
    });

    return [
      {
        key: "ok",
        label: "Status",
        values: Array.from(statusCodes.entries())
          .map(([value, count]) => ({
            value: value === "OK" ? true : false,
            label: value,
            count,
          }))
          .sort((a, b) => a.label.localeCompare(b.label)),
      },
      {
        key: "method",
        label: "Method",
        values: Array.from(methods.entries())
          .map(([value, count]) => ({ value, label: value, count }))
          .sort((a, b) => a.label.localeCompare(b.label)),
      },
      {
        key: "region",
        label: "Region",
        values: Array.from(regions.entries())
          .map(([value, count]) => ({
            value,
            label: getRegionNameFromCode(value) || value,
            count,
          }))
          .sort((a, b) => a.label.localeCompare(b.label)),
      },
    ];
  }, [data]);

  useEffect(() => {
    const column = table.getColumn("created_at");
    if (column) {
      column.setFilterValue(
        dateFrom || dateTo ? { from: dateFrom, to: dateTo } : undefined
      );
    }
  }, [dateFrom, dateTo, table]);

  useEffect(() => {
    const column = table.getColumn("latency");
    if (column) {
      const min = latencyRange.min
        ? Number.parseInt(latencyRange.min, 10)
        : undefined;
      const max = latencyRange.max
        ? Number.parseInt(latencyRange.max, 10)
        : undefined;

      if (
        (min !== undefined && !isNaN(min)) ||
        (max !== undefined && !isNaN(max))
      ) {
        column.setFilterValue({ min, max });
      } else {
        column.setFilterValue(undefined);
      }
    }
  }, [latencyRange, table]);

  useEffect(() => {
    const column = table.getColumn("url");
    if (column) {
      column.setFilterValue(urlFilter || undefined);
    }
  }, [urlFilter, table]);

  const handleFilterChange = (
    columnKey: string,
    value: string | number | boolean,
    checked: boolean
  ) => {
    const column = table.getColumn(columnKey);
    if (!column) return;

    const currentFilter =
      (column.getFilterValue() as Array<string | number | boolean>) || [];
    const newFilter = checked
      ? [...currentFilter, value]
      : currentFilter.filter((v) => v !== value);

    column.setFilterValue(newFilter.length > 0 ? newFilter : undefined);
  };

  const clearAllFilters = () => {
    table.resetColumnFilters();
    setDateFrom(undefined);
    setDateTo(undefined);
    setLatencyRange({ min: "", max: "" });
    setUrlFilter("");
  };

  const hasActiveFilters = table.getState().columnFilters.length > 0;

  return (
    <div className="bg-background w-72 border-r">
      <div className="flex h-10 items-center justify-between p-2 px-4">
        <div className="flex items-center gap-2">
          <h2 className="font-medium">Filters</h2>
        </div>
        {hasActiveFilters && (
          <Button variant="ghost" size="xs" onClick={clearAllFilters}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <ScrollArea className="">
        <div className="space-y-4 p-2 px-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Date Range</Label>
            <div className="grid grid-cols-2 gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="justify-start text-xs"
                  >
                    <CalendarIcon className="mr-2 h-3 w-3" />
                    {dateFrom ? format(dateFrom, "MMM dd") : "From"}
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
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="justify-start text-xs"
                  >
                    <CalendarIcon className="mr-2 h-3 w-3" />
                    {dateTo ? format(dateTo, "MMM dd") : "To"}
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

          <Separator />

          <div className="space-y-2">
            <Label className="text-sm font-medium">URL</Label>
            <Input
              placeholder="Filter URLs..."
              value={urlFilter}
              onChange={(e) => setUrlFilter(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label className="text-sm font-medium">Latency (ms)</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                placeholder="Min"
                value={latencyRange.min}
                onChange={(e) =>
                  setLatencyRange((prev) => ({ ...prev, min: e.target.value }))
                }
                className="h-8 text-xs"
              />
              <Input
                type="number"
                placeholder="Max"
                value={latencyRange.max}
                onChange={(e) =>
                  setLatencyRange((prev) => ({ ...prev, max: e.target.value }))
                }
                className="h-8 text-xs"
              />
            </div>
          </div>

          <Separator />

          {filterGroups.map((group) => (
            <div key={group.key} className="space-y-2">
              <Label className="text-sm font-medium">{group.label}</Label>
              <div className="max-h-32 space-y-2 overflow-y-auto">
                {group.values.map((item) => {
                  const currentFilter =
                    (table.getColumn(group.key)?.getFilterValue() as Array<
                      string | number | boolean
                    >) || [];
                  const isChecked = currentFilter.includes(item.value);

                  return (
                    <div
                      key={String(item.value)}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`${group.key}-${item.value}`}
                          checked={isChecked}
                          onCheckedChange={(checked) =>
                            handleFilterChange(
                              group.key,
                              item.value,
                              Boolean(checked)
                            )
                          }
                        />
                        <Label
                          htmlFor={`${group.key}-${item.value}`}
                          className="cursor-pointer text-xs"
                        >
                          {item.label}
                        </Label>
                      </div>
                      <span className="text-muted-foreground text-xs">
                        {item.count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
