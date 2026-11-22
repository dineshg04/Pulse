import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getIssueDetail, updateIssueStatus } from "../api/issueDetail.api";

import type { DashboardFilters, IssueStatus } from "../types/dashboard";

export const useIssueDetail = (
  id: number,
  filters: DashboardFilters,
  enabled = true,
) =>
  useQuery({
    queryKey: ["issue", id, filters],
    queryFn: () => getIssueDetail(id, filters),
    enabled,
  });

export const useUpdateIssueStatus = (id: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (status: IssueStatus) => updateIssueStatus(id, status),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["issue", id],
      });

      queryClient.invalidateQueries({
        queryKey: ["issues"],
      });

      queryClient.invalidateQueries({
        queryKey: ["top-issues"],
      });
    },
  });
};
