import { Metric } from "./types";

export function generateCollectorToken(): string {
  return `shamva_${crypto.randomUUID().replace(/-/g, "")}`;
}

export function calculateAverage(metrics: Metric[], key: keyof Metric): number {
  const values = metrics
    .map((metric) => Number(metric[key]))
    .filter((value) => !isNaN(value) && value > 0);

  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function calculatePrevPeriodAverage(
  metrics: Metric[],
  key: keyof Metric
): number {
  const sortedMetrics = [...metrics].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const midPoint = Math.floor(sortedMetrics.length / 2);
  const prevMetrics = sortedMetrics.slice(0, midPoint);

  return calculateAverage(prevMetrics, key);
}

export function getCurrentPeriodAverage(
  metrics: Metric[],
  key: keyof Metric
): number {
  const sortedMetrics = [...metrics].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const midPoint = Math.floor(sortedMetrics.length / 2);
  const currentMetrics = sortedMetrics.slice(midPoint);

  return calculateAverage(currentMetrics, key);
}
