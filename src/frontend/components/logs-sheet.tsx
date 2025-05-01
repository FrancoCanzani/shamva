import { Route } from "@/frontend/routes/dashboard/logs/index";
import { Table } from "@tanstack/react-table";
import { format, parseISO } from "date-fns";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { useMemo } from "react";
import { Log } from "../lib/types";
import { cn, getStatusTextColor } from "../lib/utils";
import { Button } from "./ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "./ui/sheet";

export default function LogsSheet({ table }: { table: Table<Log> }) {
  const navigate = Route.useNavigate();
  const { logId } = Route.useSearch();

  const sortedFilteredRows = table.getRowModel().rows;

  const selectedLogIndex = useMemo(() => {
    if (!logId) return -1;
    return sortedFilteredRows.findIndex((row) => row.original.id === logId);
  }, [logId, sortedFilteredRows]);

  const selectedLog = useMemo(() => {
    if (selectedLogIndex === -1) return null;
    return sortedFilteredRows[selectedLogIndex]?.original;
  }, [selectedLogIndex, sortedFilteredRows]);

  const handleCloseSheet = () => {
    navigate({
      search: () => ({ logId: "" }),
      replace: true,
    });
  };

  const canGoPrevious = selectedLogIndex > 0;
  const canGoNext =
    selectedLogIndex !== -1 && selectedLogIndex < sortedFilteredRows.length - 1;

  const goToPrevious = () => {
    if (canGoPrevious) {
      const previousLogId =
        sortedFilteredRows[selectedLogIndex - 1].original.id;
      navigate({
        search: (prev) => ({ ...prev, logId: previousLogId }),
        replace: true,
      });
    }
  };

  const goToNext = () => {
    if (canGoNext) {
      const nextLogId = sortedFilteredRows[selectedLogIndex + 1].original.id;
      navigate({
        search: (prev) => ({ ...prev, logId: nextLogId }),
        replace: true,
      });
    }
  };

  return (
    <Sheet
      open={!!logId && selectedLogIndex !== -1}
      onOpenChange={(isOpen) => {
        if (!isOpen) handleCloseSheet();
      }}
    >
      <SheetContent className="w-full sm:max-w-xl flex flex-col">
        {selectedLog ? (
          <>
            <SheetHeader className="flex-shrink-0 flex items-start justify-between w-full flex-row">
              <div className="">
                <SheetTitle>Log Details</SheetTitle>
                <SheetDescription className="font-mono text-xs break-all">
                  {selectedLog.url}
                </SheetDescription>
              </div>

              <div className="space-x-2 flex justify-end">
                <Button
                  variant="outline"
                  size={"xs"}
                  className="text-xs rounded-xs"
                  onClick={goToPrevious}
                  disabled={!canGoPrevious}
                >
                  <ChevronUp />
                </Button>
                <Button
                  variant="outline"
                  size={"xs"}
                  className="text-xs rounded-xs"
                  onClick={goToNext}
                  disabled={!canGoNext}
                >
                  <ChevronDown />
                </Button>

                <Button
                  variant="outline"
                  size={"xs"}
                  className="text-xs rounded-xs"
                  onClick={goToNext}
                  disabled={!canGoNext}
                  asChild
                >
                  <SheetClose>
                    <X />
                  </SheetClose>
                </Button>
              </div>
            </SheetHeader>
            <div className="p-4 space-y-4 overflow-y-auto flex-grow">
              <div className="divide-y divide-dashed space-y-1 text-sm">
                <div className="flex items-center justify-between py-2">
                  <strong>Timestamp</strong>
                  <time>
                    {format(
                      parseISO(selectedLog.created_at),
                      "LLL dd, y HH:mm:ss",
                    )}
                  </time>
                </div>
                <div className="flex items-center justify-between py-2">
                  <strong>Method</strong>
                  <span className="font-mono">{selectedLog.method}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <strong>Status</strong>
                  <span
                    className={cn(
                      "font-mono font-medium",
                      getStatusTextColor(selectedLog.status_code),
                    )}
                  >
                    {selectedLog.status_code === -1
                      ? "ERR"
                      : selectedLog.status_code}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <strong>Latency</strong>
                  <span className="font-mono">
                    {selectedLog.latency >= 0
                      ? `${selectedLog.latency.toFixed(0)}ms`
                      : "N/A"}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <strong>Region</strong>
                  <span className="font-mono">{selectedLog.colo || "N/A"}</span>
                </div>
              </div>

              {selectedLog.error && (
                <div className="text-sm">
                  <p>
                    <strong>Error:</strong>
                  </p>{" "}
                  <pre className="text-xs bg-red-50 dark:bg-red-900/30 p-2 mt-2 rounded-sm overflow-auto max-h-48 text-red-700 dark:text-red-300">
                    {selectedLog.error}
                  </pre>
                </div>
              )}

              <div>
                <strong className="text-sm">Headers</strong>
                <pre className="text-xs bg-muted p-2 mt-2 rounded-sm overflow-auto max-h-48 font-mono">
                  {JSON.stringify(selectedLog.headers, null, 2)}
                </pre>
              </div>
              <div>
                <strong className="text-sm">Body Content</strong>
                <pre className="text-xs bg-muted p-2 mt-2 rounded-sm overflow-auto max-h-96 font-mono">
                  {(() => {
                    try {
                      if (
                        selectedLog.body_content &&
                        typeof selectedLog.body_content === "object" &&
                        "_rawContent" in selectedLog.body_content
                      ) {
                        return selectedLog.body_content._rawContent;
                      }
                      if (
                        selectedLog.body_content &&
                        typeof selectedLog.body_content === "object"
                      ) {
                        return JSON.stringify(
                          selectedLog.body_content,
                          null,
                          2,
                        );
                      }
                      return String(selectedLog.body_content ?? "N/A");
                    } catch {
                      return String(selectedLog.body_content ?? "N/A");
                    }
                  })()}
                </pre>
              </div>
            </div>
          </>
        ) : (
          <div className="p-4 text-center text-muted-foreground">
            {logId ? "Log not found in current view." : "No log selected."}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
