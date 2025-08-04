import { Button } from "@/frontend/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/frontend/components/ui/sheet";
import { Route } from "@/frontend/routes/dashboard/$workspaceName/logs/index";
import { Log } from "@/frontend/types/types";
import {
  cn,
  copyToClipboard,
  getOkStatusTextColor,
  getRegionNameFromCode,
  getStatusTextColor,
} from "@/frontend/utils/utils";
import type { Table } from "@tanstack/react-table";
import { format, parseISO } from "date-fns";
import { Check, ChevronDown, ChevronUp, Copy, X } from "lucide-react";
import { useMemo, useState } from "react";

export default function LogsSheet({ table }: { table: Table<Log> }) {
  const navigate = Route.useNavigate();
  const { logId } = Route.useSearch();
  const [copyStatus, setCopyStatus] = useState<{
    headers: boolean;
    body: boolean;
  }>({
    headers: false,
    body: false,
  });

  const sortedFilteredRows = table.getRowModel().rows;

  const selectedLogIndex = useMemo(() => {
    if (!logId) return -1;
    return sortedFilteredRows.findIndex((row) => row.original.id === logId);
  }, [logId, sortedFilteredRows]);

  const selectedLog = useMemo(() => {
    if (selectedLogIndex === -1) return null;
    return sortedFilteredRows[selectedLogIndex]?.original;
  }, [selectedLogIndex, sortedFilteredRows]);

  const headersArray = useMemo(() => {
    if (!selectedLog?.headers) return [];

    try {
      const headersObj =
        typeof selectedLog.headers === "string"
          ? JSON.parse(selectedLog.headers)
          : selectedLog.headers;

      return Object.entries(headersObj)
        .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
        .map(([key, value]) => ({ key, value: String(value) }));
    } catch {
      return [];
    }
  }, [selectedLog?.headers]);

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
        search: (prev) => ({
          ...prev,
          logId: previousLogId,
        }),
        replace: true,
      });
    }
  };

  const goToNext = () => {
    if (canGoNext) {
      const nextLogId = sortedFilteredRows[selectedLogIndex + 1].original.id;
      navigate({
        search: (prev) => ({
          ...prev,
          logId: nextLogId,
        }),
        replace: true,
      });
    }
  };

  const handleCopyHeaders = async () => {
    if (!selectedLog?.headers) return;

    try {
      const headersText = headersArray
        .map(({ key, value }) => `${key}: ${value}`)
        .join("\n");

      await copyToClipboard(headersText);
      setCopyStatus((prev) => ({ ...prev, headers: true }));
      setTimeout(
        () => setCopyStatus((prev) => ({ ...prev, headers: false })),
        2000
      );
    } catch (error) {
      console.error("Failed to copy headers:", error);
    }
  };

  const handleCopyBody = async () => {
    if (!selectedLog?.body_content) return;

    try {
      let bodyText;
      if (
        typeof selectedLog.body_content === "object" &&
        selectedLog.body_content !== null &&
        "_rawContent" in selectedLog.body_content
      ) {
        bodyText = String(selectedLog.body_content._rawContent ?? "");
      } else if (typeof selectedLog.body_content === "object") {
        bodyText = JSON.stringify(selectedLog.body_content, null, 2);
      } else {
        bodyText = String(selectedLog.body_content ?? "");
      }

      await copyToClipboard(bodyText);
      setCopyStatus((prev) => ({ ...prev, body: true }));
      setTimeout(
        () => setCopyStatus((prev) => ({ ...prev, body: false })),
        2000
      );
    } catch (error) {
      console.error("Failed to copy body:", error);
    }
  };

  return (
    <Sheet
      open={!!logId && selectedLogIndex !== -1}
      onOpenChange={(isOpen) => {
        if (!isOpen) handleCloseSheet();
      }}
    >
      <SheetContent className="flex w-full flex-col sm:max-w-xl">
        {selectedLog ? (
          <>
            <SheetHeader className="flex w-full flex-shrink-0 flex-row items-start justify-between">
              <div className="">
                <SheetTitle>Log Details</SheetTitle>
                <SheetDescription className="font-mono text-xs break-all">
                  {selectedLog.url}
                </SheetDescription>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  size={"xs"}
                  className="text-xs"
                  onClick={goToPrevious}
                  disabled={!canGoPrevious}
                >
                  <ChevronUp />
                </Button>
                <Button
                  variant="outline"
                  size={"xs"}
                  className="text-xs"
                  onClick={goToNext}
                  disabled={!canGoNext}
                >
                  <ChevronDown />
                </Button>

                <Button
                  variant="outline"
                  size={"xs"}
                  className="text-xs"
                  asChild
                >
                  <SheetClose>
                    <X />
                  </SheetClose>
                </Button>
              </div>
            </SheetHeader>
            <div className="flex flex-grow flex-col space-y-4 overflow-y-auto p-4">
              <div className="flex-shrink-0 space-y-1 divide-y divide-dashed text-sm">
                <div className="flex items-center justify-between py-2">
                  <span className="font-medium">Timestamp</span>
                  <time>
                    {format(
                      parseISO(selectedLog.created_at),
                      "LLL dd, y HH:mm:ss"
                    )}
                  </time>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="font-medium">Method</span>
                  <span className="font-mono">{selectedLog.method}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="font-medium">Status</span>
                  <span
                    className={cn(
                      "font-mono font-medium",
                      selectedLog.check_type === "http" &&
                        typeof selectedLog.status_code === "number"
                        ? getStatusTextColor(selectedLog.status_code)
                        : getOkStatusTextColor(selectedLog.ok)
                    )}
                  >
                    {selectedLog.check_type === "http" &&
                    typeof selectedLog.status_code === "number"
                      ? selectedLog.status_code
                      : typeof selectedLog.ok === "boolean"
                        ? selectedLog.ok
                          ? "OK"
                          : "ERR"
                        : "ERR"}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="font-medium">Latency</span>
                  <span className="font-mono">
                    {selectedLog.latency >= 0
                      ? `${selectedLog.latency.toFixed(0)}ms`
                      : "-"}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="font-medium">Region</span>
                  <span className="font-mono">
                    {(selectedLog.region &&
                      getRegionNameFromCode(selectedLog.region)) ||
                      "-"}
                  </span>
                </div>
              </div>

              {selectedLog.error && (
                <div className="flex-shrink-0 text-sm">
                  <p>
                    <span>Error:</span>
                  </p>{" "}
                  <pre className="mt-2 max-h-48 overflow-auto bg-red-50 p-2 text-xs text-red-700 dark:bg-red-900/30 dark:text-red-300">
                    {selectedLog.error}
                  </pre>
                </div>
              )}

              {/* TCP Check Information */}
              {selectedLog.check_type === "tcp" &&
                selectedLog.tcp_host &&
                selectedLog.tcp_port && (
                  <div className="flex-shrink-0 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">TCP Check Details</span>
                    </div>
                    <div className="mt-2 rounded border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/30">
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="font-medium text-blue-700 dark:text-blue-300">
                            Host:
                          </span>
                          <span className="font-mono text-blue-700 dark:text-blue-300">
                            {selectedLog.tcp_host}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-blue-700 dark:text-blue-300">
                            Port:
                          </span>
                          <span className="font-mono text-blue-700 dark:text-blue-300">
                            {selectedLog.tcp_port}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-blue-700 dark:text-blue-300">
                            Host:Port:
                          </span>
                          <span className="font-mono text-blue-700 dark:text-blue-300">
                            {selectedLog.tcp_host}:{selectedLog.tcp_port}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              <div className="flex-shrink-0">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Headers</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={handleCopyHeaders}
                    disabled={headersArray.length === 0}
                  >
                    {copyStatus.headers ? (
                      <>
                        <Check className="h-3 w-3" />
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                      </>
                    )}
                  </Button>
                </div>
                {headersArray.length > 0 ? (
                  <div className="mt-2 overflow-auto border">
                    <table className="w-full text-xs">
                      <tbody className="divide-y">
                        {headersArray.map(({ key, value }, index) => (
                          <tr
                            key={index}
                            className="odd:bg-stone-50 dark:odd:bg-stone-800"
                          >
                            <td className="px-2 py-1.5 text-left font-mono font-medium">
                              {key}
                            </td>
                            <td className="px-2 py-1.5 text-left font-mono break-all whitespace-pre-wrap">
                              {value}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="bg-muted text-muted-foreground mt-2 p-2 text-center text-xs">
                    No headers available
                  </div>
                )}
              </div>
              <div className="flex min-h-0 flex-grow flex-col">
                <div className="flex flex-shrink-0 items-center justify-between">
                  <span className="font-medium">Body Content</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={handleCopyBody}
                    disabled={!selectedLog.body_content}
                  >
                    {copyStatus.body ? (
                      <>
                        <Check className="h-3 w-3" />
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                      </>
                    )}
                  </Button>
                </div>
                <div className="relative flex min-h-0 flex-grow flex-col">
                  <pre className="mt-2 flex-grow overflow-auto border bg-stone-50 p-2 font-mono text-xs break-words whitespace-pre-wrap dark:bg-stone-800">
                    {(() => {
                      try {
                        if (
                          selectedLog.body_content &&
                          typeof selectedLog.body_content === "object" &&
                          selectedLog.body_content !== null &&
                          "_rawContent" in selectedLog.body_content
                        ) {
                          return (
                            String(
                              selectedLog.body_content._rawContent ?? ""
                            ) || "No content"
                          );
                        }
                        if (
                          selectedLog.body_content &&
                          typeof selectedLog.body_content === "object"
                        ) {
                          return JSON.stringify(
                            selectedLog.body_content,
                            null,
                            2
                          );
                        }
                        return (
                          String(selectedLog.body_content ?? "") || "No content"
                        );
                      } catch (error) {
                        console.error("Error rendering body content:", error);
                        return "Error displaying content";
                      }
                    })()}
                  </pre>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-muted-foreground p-4 text-center">
            {logId ? "Log not found in current view." : "No log selected."}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
