export type Environment = "production" | "staging" | "development" | "all";

export type TimeRange = "1h" | "24h" | "7d" | "custom";

export type ChartInterval = "5m" | "1h" | "1d";

export type IssueStatus = "open" | "resolved" | "ignored";

export interface DashboardFilters {
  from: string;
  to: string;
  environment: Environment;
}

// GET /api/overview
export interface OverviewResponse {
  totalRequests: number;
  totalErrors: number;
  errorRate: number;
  p95ResponseTime: number | null;
  affectedUsers: number;
}

// GET /api/timeseries
export interface TimeseriesPoint {
  timestamp: string;
  count: number;
}

export interface TimeseriesResponse {
  metric: "errors" | "requests";
  interval: ChartInterval;
  data: TimeseriesPoint[];
}

// GET /api/issues
export interface Issue {
  id: number;
  errorType: string;
  message: string;
  firstSeen: string;
  lastSeen: string;
  totalCount: number;
  affectedUsers: number;
  status: IssueStatus;
  environments: string[];
}

export interface IssueListResponse {
  data: Issue[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface IssueDetail {
  id: number;
  errorType: string;
  message: string;
  status: IssueStatus;
  stackTrace: string;
  firstSeen: string;
  lastSeen: string;
  totalCount: number;
  affectedUsers: number;
}

export interface IssueOccurrence {
  id: number;
  timestamp: string;
  environment: Environment;
  url: string;
  userId: string | null;
  browser: string | null;
}

export interface IssueDetailResponse {
  issue: IssueDetail;
  occurrences: IssueOccurrence[];
  timeseries: TimeseriesPoint[];
}

export interface UpdateIssueStatusResponse {
  message: string;
  issue: Pick<IssueDetail, "id" | "errorType" | "message" | "status">;
}
