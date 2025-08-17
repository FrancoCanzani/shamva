import NotFoundMessage from "@/frontend/components/not-found-message";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/frontend/components/ui/chart";
import { mapUptime } from "@/frontend/features/monitors/utils";
import { Log } from "@/frontend/lib/types";
import { Route } from "@/frontend/routes/dashboard/$workspaceName/monitors/$id";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

const chartConfig = {
  ok: {
    label: "Success",
    color: "hsl(var(--chart-1))",
  },
  error: {
    label: "Error",
    color: "hsl(var(--chart-2))",
  },
  degraded: {
    label: "Degraded",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig;

interface UptimeChartProps {
  logs: Partial<Log>[];
}

export default function NewMonitorUptimeChart({ logs }: UptimeChartProps) {
  const { days } = Route.useSearch();

  if (!logs || logs.length === 0) {
    return <NotFoundMessage message="No uptime data" />;
  }

  const allUptimeData = mapUptime(logs, days);

  // Filter empty buckets to prevent showing empty columns
  const uptimeData = allUptimeData.filter((bucket) => bucket.total > 0);

  if (uptimeData.length === 0) {
    return <NotFoundMessage message="No uptime data" />;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Uptime</h3>
        <div className="text-muted-foreground flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-xs bg-green-800" />
            <span>Success</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-xs bg-red-800" />
            <span>Error</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-xs bg-yellow-500" />
            <span>Degraded</span>
          </div>
        </div>
      </div>

      <ChartContainer config={chartConfig} className="h-28 w-full">
        <BarChart
          data={uptimeData}
          barCategoryGap={2}
          margin={{ top: 5, right: 0, left: 30, bottom: 0 }}
        >
          <CartesianGrid vertical={false} />
          <YAxis
            domain={["dataMin", "dataMax"]}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            orientation="right"
          />
          <XAxis
            dataKey="interval"
            tickLine={false}
            tickMargin={8}
            minTickGap={20}
            axisLine={false}
            type="category"
            tick={{ fontSize: 11 }}
            domain={["dataMin", "dataMax"]}
          />
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent indicator="dot" />}
          />
          <Bar dataKey="ok" stackId="a" fill="#166534" />
          <Bar dataKey="error" stackId="a" fill="#991b1b" />
          <Bar dataKey="degraded" stackId="a" fill="#eab308" />
        </BarChart>
      </ChartContainer>
    </div>
  );
}
