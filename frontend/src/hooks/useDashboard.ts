import { useQuery } from "@tanstack/react-query";

import { getOverview, getTimeseries, getTopIssues } from "../api/dashboard.api";

import type { DashboardFilters, ChartInterval } from "../types/dashboard";

export const useOverview = (filters: DashboardFilters, enabled = true) => {
  return useQuery({
    queryKey: ["overview", filters],
    queryFn: () => getOverview(filters),
    enabled,
  });
};

export const useTimeseries = (
  filters: DashboardFilters,
  metric: "errors" | "requests",
  interval: ChartInterval,
  enabled = true,
) => {
  return useQuery({
    queryKey: ["timeseries", filters, metric, interval],
    queryFn: () =>
      getTimeseries({
        ...filters,
        metric,
        interval,
      }),
    enabled,
  });
};

export const useTopIssues = (filters: DashboardFilters, enabled = true) => {
  return useQuery({
    queryKey: ["top-issues", filters],
    queryFn: () => getTopIssues(filters),
    enabled,
  });
};
