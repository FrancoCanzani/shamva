import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Route } from "@/frontend/routes/dashboard/$workspaceName/logs";
import { Log } from "@/frontend/types/types";
import { cn } from "@/frontend/utils/utils";
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

  const rows = useMemo<Log[]>(() => {
    const flat = (data?.pages || []).flatMap((p) => p.data);
    return flat.filter((log) => {
      if (statusFilter === "ok" && !log.ok) return false;
      if (statusFilter === "err" && log.ok) return false;
      if (!search.trim()) return true;
      const hay =
        `${log.method ?? ""} ${log.url ?? ""} ${log.tcp_host ?? ""} ${log.error ?? ""}`.toLowerCase();
      return hay.includes(search.toLowerCase());
    });
  }, [data, statusFilter, search]);

  const parentRef = useRef<HTMLDivElement | null>(null);
  const rowVirtualizer = useVirtualizer({
    count: rows.length + (hasNextPage ? 1 : 0),
    getScrollElement: () => parentRef.current,
    estimateSize: () => 36,
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

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col">
      <div className="flex items-center justify-between gap-2 border-b p-2">
        <div className="flex items-center gap-1">
          <Button
            variant={statusFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("all")}
          >
            All
          </Button>
          <Button
            variant={statusFilter === "ok" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("ok")}
          >
            OK
          </Button>
          <Button
            variant={statusFilter === "err" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("err")}
          >
            Failed
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search logs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 w-64"
          />
        </div>
      </div>

      <div ref={parentRef} className="min-h-0 flex-1 overflow-auto">
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
                  "border-b border-dashed transition-colors duration-100",
                  !isLoaderRow && log?.ok
                    ? "even:bg-stone-50/50 hover:bg-slate-100 dark:even:bg-slate-900/20 dark:hover:bg-slate-800/50"
                    : !isLoaderRow
                      ? "bg-red-50/40 hover:bg-red-100/60 dark:bg-red-900/20 dark:hover:bg-red-800/30"
                      : ""
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
                    className="grid h-full cursor-pointer items-center gap-2 px-2 text-sm"
                    style={{
                      gridTemplateColumns: "170px 80px 70px 1fr 160px",
                    }}
                    onClick={() =>
                      navigate({
                        search: (prev) => ({ ...prev, logId: log.id }),
                        replace: true,
                      })
                    }
                  >
                    <div className="text-muted-foreground whitespace-nowrap">
                      {(() => {
                        try {
                          const d = parseISO(log.created_at);
                          return format(d, "LLL dd, y HH:mm:ss");
                        } catch {
                          return "Invalid Date";
                        }
                      })()}
                    </div>
                    <div>
                      <span
                        className={cn(
                          "rounded px-1.5 py-0.5 text-xs font-semibold",
                          log.ok
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                        )}
                      >
                        {log.ok ? "OK" : "ERROR"}
                      </span>
                    </div>
                    <div className="font-medium">
                      {log.check_type === "tcp" ? "TCP" : log.method}
                    </div>
                    <div
                      className="truncate"
                      title={
                        log.check_type === "tcp"
                          ? [log.tcp_host, log.tcp_port]
                              .filter(Boolean)
                              .join(":")
                          : log.url || ""
                      }
                    >
                      {(() => {
                        const target =
                          log.check_type === "tcp"
                            ? [log.tcp_host, log.tcp_port]
                                .filter(Boolean)
                                .join(":")
                            : log.url;
                        if (!target)
                          return (
                            <span className="text-muted-foreground">-</span>
                          );
                        const isHttp = /^https?:\/\//i.test(target);
                        return isHttp ? (
                          <a
                            href={target}
                            target="_blank"
                            rel="noreferrer"
                            className="underline-offset-2 hover:underline"
                          >
                            {target}
                          </a>
                        ) : (
                          <span>{target}</span>
                        );
                      })()}
                    </div>
                    <div className="text-right">
                      {!log.ok && log.error ? (
                        <span className="text-red-600 dark:text-red-300">
                          {log.error}
                        </span>
                      ) : typeof log.latency === "number" &&
                        log.latency >= 0 ? (
                        <span className="font-mono">
                          {Math.round(log.latency)}ms
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
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
