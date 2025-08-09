import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Route } from "@/frontend/routes/dashboard/$workspaceName/logs";
import { BodyContent, Log } from "@/frontend/types/types";
import { cn, getRegionNameFromCode } from "@/frontend/utils/utils";
import { GlobeIcon } from "@radix-ui/react-icons";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import { format, parseISO } from "date-fns";
import { useEffect, useMemo, useRef, useState } from "react";
import { useInView } from "react-intersection-observer";
import { fetchLogsPage, LogsPage } from "../api/logs";
import LogsSheet from "./logs-sheet";

export function LogsInfiniteTable() {
  const navigate = Route.useNavigate();
  const context = Route.useRouteContext();
  const { workspaceName } = Route.useParams();
  const [statusFilter, setStatusFilter] = useState<"all" | "ok" | "err">("all");
  const [search, setSearch] = useState("");

  const { data, status, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useInfiniteQuery<LogsPage>({
      queryKey: ["logs"],
      queryFn: ({ pageParam }) =>
        fetchLogsPage({
          workspaceName,
          cursor:
            (pageParam as { createdAt: string; id: string } | null) ?? null,
          context,
        }),
      initialPageParam: null as { createdAt: string; id: string } | null,
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      staleTime: 15_000,
    });

  const { rows, counts } = useMemo(() => {
    const flat = (data?.pages || []).flatMap((p) => p.data);

    const matchesSearch = (log: Log) => {
      if (!search.trim()) return true;
      const hay =
        `${log.method ?? ""} ${log.url ?? ""} ${log.tcp_host ?? ""} ${log.error ?? ""}`.toLowerCase();
      return hay.includes(search.toLowerCase());
    };

    const searchFiltered = flat.filter(matchesSearch);
    const counts = {
      all: searchFiltered.length,
      ok: searchFiltered.filter((l) => l.ok).length,
      err: searchFiltered.filter((l) => !l.ok).length,
    };

    const rows = searchFiltered.filter((log) => {
      if (statusFilter === "ok" && !log.ok) return false;
      if (statusFilter === "err" && log.ok) return false;
      return true;
    });

    return { rows, counts } as {
      rows: Log[];
      counts: { all: number; ok: number; err: number };
    };
  }, [data, statusFilter, search]);

  const parentRef = useRef<HTMLDivElement | null>(null);
  const rowVirtualizer = useVirtualizer({
    count: rows.length + (hasNextPage ? 1 : 0),
    getScrollElement: () => parentRef.current,
    estimateSize: () => 30,
    overscan: 10,
  });

  const { ref: lastItemRef, inView } = useInView({
    threshold: 0.1,
    triggerOnce: false,
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const isBodyContent = (v: unknown): v is BodyContent => {
    return (
      typeof v === "object" &&
      v !== null &&
      "raw" in (v as Record<string, unknown>)
    );
  };

  const getBodyPreview = (bc: unknown): string => {
    if (isBodyContent(bc) && typeof bc.raw === "string") return bc.raw;
    return String(bc ?? "");
  };

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col font-mono text-xs">
      <div className="flex items-center justify-between gap-2 border-b p-3">
        <div className="flex items-center gap-1">
          <Button
            variant={statusFilter === "all" ? "default" : "outline"}
            size="xs"
            className="font-mono text-xs"
            onClick={() => setStatusFilter("all")}
          >
            All ({counts.all})
          </Button>
          <Button
            variant={statusFilter === "ok" ? "default" : "outline"}
            size="xs"
            className="font-mono text-xs"
            onClick={() => setStatusFilter("ok")}
          >
            OK ({counts.ok})
          </Button>
          <Button
            variant={statusFilter === "err" ? "default" : "outline"}
            size="xs"
            className="font-mono text-xs"
            onClick={() => setStatusFilter("err")}
          >
            Failed ({counts.err})
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search logs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-7 font-mono text-xs"
          />
        </div>
      </div>

      <div ref={parentRef} className="min-h-0 flex-1 overflow-auto">
        {rows.length === 0 ? (
          <div className="text-muted-foreground flex h-full items-center justify-center p-6 text-xs">
            No logs to display.
          </div>
        ) : (
          <div
            style={{
              height: rowVirtualizer.getTotalSize(),
              position: "relative",
            }}
          >
            {rowVirtualizer.getVirtualItems().map((vi) => {
              const index = vi.index;
              const isLoaderRow = index >= rows.length;
              const log = rows[index];
              return (
                <div
                  key={vi.key}
                  data-index={index}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: vi.size,
                    transform: `translateY(${vi.start}px)`,
                  }}
                  className={cn(
                    "border-b border-dashed transition-colors duration-100 hover:bg-slate-50 dark:hover:bg-slate-900"
                  )}
                >
                  {isLoaderRow ? (
                    <div
                      ref={lastItemRef}
                      className="text-muted-foreground flex h-full items-center justify-center text-xs"
                    >
                      {hasNextPage
                        ? isFetchingNextPage
                          ? "Loading more…"
                          : "Load more"
                        : "End of results"}
                    </div>
                  ) : (
                    <div
                      className="flex h-full w-full cursor-pointer items-center justify-start gap-2 px-3 text-sm"
                      onClick={() =>
                        navigate({
                          search: (prev) => ({ ...prev, logId: log.id }),
                          replace: true,
                        })
                      }
                    >
                      <div className="text-muted-foreground flex-none whitespace-nowrap">
                        {(() => {
                          try {
                            const d = parseISO(log.created_at);
                            return format(d, "LLL dd, y HH:mm:ss");
                          } catch {
                            return "Invalid Date";
                          }
                        })()}
                      </div>
                      <div className="flex-none font-medium uppercase">
                        {log.check_type === "tcp" ? "TCP" : log.method}
                      </div>
                      <div className="w-8 flex-none">
                        {typeof log.latency === "number" && log.latency >= 0 ? (
                          <span>{Math.round(log.latency)}ms</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </div>
                      <div
                        className={cn(
                          "w-14 flex-none",
                          log.ok
                            ? "text-green-800 dark:text-green-50"
                            : "text-red-800 dark:text-red-50"
                        )}
                      >
                        {log.ok ? "[OK]" : "[ERROR]"}
                      </div>
                      <div className="underline">
                        {(() => {
                          const target =
                            log.check_type === "tcp"
                              ? [log.tcp_host, log.tcp_port]
                                  .filter(Boolean)
                                  .join(":")
                              : log.url;
                          if (target)
                            return (
                              <a href={target} target="_blank" rel="noreferrer">
                                {target}
                              </a>
                            );
                        })()}
                      </div>
                      <div className="hidden items-center justify-start gap-x-1.5 truncate lg:flex">
                        <GlobeIcon className="h-3 w-3 text-blue-800" />
                        <span>{getRegionNameFromCode(log.region)}</span>
                      </div>
                      <div className="text-muted-foreground hidden min-w-0 flex-1 truncate whitespace-nowrap sm:block">
                        {getBodyPreview(log.body_content)}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      <div className="text-muted-foreground flex items-center justify-between border-t px-2 py-1 text-xs">
        <div>
          {status === "pending" ? "Loading…" : `${rows.length} rows`}
          {isFetchingNextPage ? " • Loading more…" : ""}
        </div>
        {!hasNextPage && <div>End of results</div>}
      </div>

      <LogsSheet logs={rows} />
    </div>
  );
}
