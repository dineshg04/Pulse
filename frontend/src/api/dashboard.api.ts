import api from "./axios";

import type {
  DashboardFilters,
  OverviewResponse,
  TimeseriesResponse,
  ChartInterval,
  IssueListResponse,
} from "../types/dashboard";

// GET /api/overview
export const getOverview = async (
  filters: DashboardFilters,
): Promise<OverviewResponse> => {
  const response = await api.get<OverviewResponse>("/overview", {
    params: filters,
  });

  return response.data;
};

// GET /api/timeseries
export const getTimeseries = async (
  filters: DashboardFilters & {
    metric: "errors" | "requests";
    interval: ChartInterval;
  },
): Promise<TimeseriesResponse> => {
  const response = await api.get<TimeseriesResponse>("/timeseries", {
    params: filters,
  });

  return response.data;
};

// GET /api/issues
export const getTopIssues = async (
  filters: DashboardFilters,
): Promise<IssueListResponse> => {
  const response = await api.get<IssueListResponse>("/issues", {
    params: {
      ...filters,
      page: 1,
      limit: 5,
      sortBy: "count",
      order: "desc",
    },
  });

  return response.data;
};
