import api from "./axios";

import type {
  DashboardFilters,
  IssueDetailResponse,
  IssueStatus,
  UpdateIssueStatusResponse,
} from "../types/dashboard";

export const getIssueDetail = async (
  id: number,
  filters: DashboardFilters,
): Promise<IssueDetailResponse> => {
  const response = await api.get<IssueDetailResponse>(`/issues/${id}`, {
    params: filters,
  });

  return response.data;
};

export const updateIssueStatus = async (
  id: number,
  status: IssueStatus,
): Promise<UpdateIssueStatusResponse> => {
  const response = await api.patch<UpdateIssueStatusResponse>(`/issues/${id}`, {
    status,
  });

  return response.data;
};
