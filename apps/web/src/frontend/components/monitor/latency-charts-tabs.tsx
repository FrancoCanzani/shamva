import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/frontend/components/ui/tabs";
import LatencyLineChart from "./latency-line-chart";
import LatencyHeatmap from "./latency-heatmap";
import { Log } from "@/frontend/lib/types";

interface LatencyChartsTabsProps {
  logs: Partial<Log>[];
  height?: number;
}

export default function LatencyChartsTabs({
  logs,
  height = 180,
}: LatencyChartsTabsProps) {
  return (
    <Tabs defaultValue="line">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="line">Line Chart</TabsTrigger>
        <TabsTrigger value="heatmap">Heatmap</TabsTrigger>
      </TabsList>
      <TabsContent value="line">
        <LatencyLineChart logs={logs} height={height} />
      </TabsContent>
      <TabsContent value="heatmap">
        <LatencyHeatmap logs={logs} height={height} />
      </TabsContent>
    </Tabs>
  );
} 