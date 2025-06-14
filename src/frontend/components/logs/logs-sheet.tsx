import { Route } from "@/frontend/routes/dashboard/$workspaceName/logs/index";
import type { Table } from "@tanstack/react-table";
import { format, parseISO } from "date-fns";
import { Check, ChevronDown, ChevronUp, Copy, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Log } from "@/frontend/lib/types";
import { cn,  copyToClipboard,
  getRegionNameFromCode,
  getStatusTextColor, } from "@/frontend/lib/utils";
import { Button } from "../ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "../ui/sheet";

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
  const [isBodyExpanded, setIsBodyExpanded] = useState(false);

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
        2000,
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
        2000,
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
                  <span className="font-medium">Timestamp</span>
                  <time>
                    {format(
                      parseISO(selectedLog.created_at),
                      "LLL dd, y HH:mm:ss",
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
                      getStatusTextColor(selectedLog.status_code),
                    )}
                  >
                    {selectedLog.status_code === -1
                      ? "ERR"
                      : selectedLog.status_code}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="font-medium">Latency</span>
                  <span className="font-mono">
                    {selectedLog.latency >= 0
                      ? `${selectedLog.latency.toFixed(0)}ms`
                      : "N/A"}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="font-medium">Region</span>
                  <span className="font-mono">
                    {(selectedLog.region &&
                      getRegionNameFromCode(selectedLog.region)) ||
                      "N/A"}
                  </span>
                </div>
              </div>

              {selectedLog.error && (
                <div className="text-sm">
                  <p>
                    <span>Error:</span>
                  </p>{" "}
                  <pre className="text-xs bg-red-50 dark:bg-red-900/30 p-2 mt-2 rounded-sm overflow-auto max-h-48 text-red-700 dark:text-red-300">
                    {selectedLog.error}
                  </pre>
                </div>
              )}

              <div>
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
                  <div className="mt-2 overflow-auto border rounded">
                    <table className="w-full text-xs">
                      <tbody className="divide-y">
                        {headersArray.map(({ key, value }, index) => (
                          <tr
                            key={index}
                            className="odd:bg-slate-50 dark:odd:bg-slate-900/30"
                          >
                            <td className="py-1.5 px-2 font-mono text-left font-medium">
                              {key}
                            </td>
                            <td className="py-1.5 px-2 font-mono text-left break-all whitespace-pre-wrap">
                              {value}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-xs bg-muted p-2 mt-2 rounded-sm text-center text-muted-foreground">
                    No headers available
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center justify-between">
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
                <div className="relative">
                  <pre
                    className={cn(
                      "text-xs bg-muted p-2 mt-2 rounded font-mono border whitespace-pre-wrap break-words overflow-hidden",
                      isBodyExpanded ? "max-h-none" : "max-h-32",
                    )}
                  >
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
                              selectedLog.body_content._rawContent ?? "",
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
                            2,
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
                  {!isBodyExpanded && selectedLog.body_content && (
                    <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-muted to-transparent flex items-end justify-center pb-1">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="h-6 px-2 text-xs bg-white"
                        onClick={() => setIsBodyExpanded(true)}
                      >
                        View more
                      </Button>
                    </div>
                  )}
                  {isBodyExpanded && (
                    <div className="mt-2 flex justify-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => setIsBodyExpanded(false)}
                      >
                        View less
                      </Button>
                    </div>
                  )}
                </div>
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
