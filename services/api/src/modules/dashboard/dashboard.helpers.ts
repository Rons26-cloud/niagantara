import type { MetricComparison } from './dashboard.dto.js';

export function comparisonMetric(
  current: number,
  previous: number,
): MetricComparison {
  const delta = current - previous;
  return {
    current,
    previous,
    delta,
    changePercent:
      previous === 0 ? (current === 0 ? 0 : null) : (delta / previous) * 100,
    availability:
      previous === 0 && current > 0 ? 'new_period_activity' : 'supported',
  };
}
