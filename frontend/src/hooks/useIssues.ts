import { useQuery } from "@tanstack/react-query";
import { getIssues } from "../api/issues.api";
import type { IssuesFilters } from "../api/issues.api";

export const useIssues = (filters: IssuesFilters, enabled = true) => {
  return useQuery({
    queryKey: ["issues", filters],
    queryFn: () => getIssues(filters),
    placeholderData: (previousData) => previousData,
    enabled,
  });
};
