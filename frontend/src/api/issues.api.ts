import api from "./axios";

import type {
  DashboardFilters,
  IssueListResponse,
  IssueStatus,
} from "../types/dashboard";

export type IssueSortBy = "count" | "lastSeen" | "firstSeen";

export interface IssuesFilters extends DashboardFilters {
  page: number;
  limit: number;
  sortBy: IssueSortBy;
  order: "asc" | "desc";
  search?: string;
  status?: IssueStatus;
}

export const getIssues = async (
  filters: IssuesFilters,
): Promise<IssueListResponse> => {
  const response = await api.get<IssueListResponse>("/issues", {
    params: filters,
  });

  return response.data;
};
