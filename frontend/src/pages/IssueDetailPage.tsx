import { useMemo } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";

import { ArrowLeft, Bug, Users, Clock, CalendarDays } from "lucide-react";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useAuth } from "../context/AuthContext";
import { useIssueDetail, useUpdateIssueStatus } from "../hooks/useIssueDetail";

import type {
  DashboardFilters,
  Environment,
  IssueStatus,
  TimeRange,
} from "../types/dashboard";

function getDateRange(range: Exclude<TimeRange, "custom">) {
  const to = new Date();
  const from = new Date(to);

  if (range === "1h") {
    from.setHours(from.getHours() - 1);
  } else if (range === "24h") {
    from.setHours(from.getHours() - 24);
  } else {
    from.setDate(from.getDate() - 7);
  }

  return {
    from: from.toISOString(),
    to: to.toISOString(),
  };
}

function getStatusColor(status: IssueStatus): "success" | "error" | "default" {
  if (status === "resolved") return "success";
  if (status === "open") return "error";
  return "default";
}

interface SummaryCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}

function SummaryCard({ title, value, icon, color }: SummaryCardProps) {
  return (
    <div className="h-full rounded-xl border border-border bg-card transition-all duration-200 hover:-translate-y-[3px] hover:shadow-[0_10px_24px_rgba(15,23,42,0.08)] dark:hover:shadow-[0_10px_24px_rgba(0,0,0,0.3)]">
      <div className="p-5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-muted-foreground">{title}</p>

          <div
            className="flex h-[38px] w-[38px] items-center justify-center rounded-lg"
            style={{
              backgroundColor: `${color}18`,
              color,
            }}
          >
            {icon}
          </div>
        </div>

        <p className="mt-4 break-words text-xl font-extrabold tracking-[-0.5px] text-foreground">
          {value}
        </p>
      </div>
    </div>
  );
}

function IssueDetailPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const issueId = Number(id);
  const validId = Number.isInteger(issueId) && issueId > 0;
  const isAdmin = user?.role === "admin";

  const range = (searchParams.get("range") as TimeRange | null) ?? "7d";

  const environment =
    (searchParams.get("environment") as Environment | null) ?? "all";

  const dateRange = useMemo(() => {
    if (range === "custom") {
      const from = searchParams.get("from");
      const to = searchParams.get("to");

      if (
        from &&
        to &&
        !Number.isNaN(Date.parse(from)) &&
        !Number.isNaN(Date.parse(to)) &&
        Date.parse(from) <= Date.parse(to)
      ) {
        return { from, to };
      }

      return getDateRange("7d");
    }

    return getDateRange(range);
  }, [range, searchParams]);

  const filters: DashboardFilters = {
    ...dateRange,
    environment,
  };

  const issueQuery = useIssueDetail(issueId, filters, validId);

  const statusMutation = useUpdateIssueStatus(issueId);

  const issue = issueQuery.data?.issue;
  const occurrences = issueQuery.data?.occurrences ?? [];
  const timeseries = issueQuery.data?.timeseries ?? [];

  const handleStatusChange = (status: IssueStatus) => {
    statusMutation.mutate(status);
  };

  const formatDate = (value: string) => new Date(value).toLocaleString();

  const formatChartDate = (value: string) =>
    new Date(value).toLocaleDateString();

  const getStatusStyles = (status: IssueStatus) => {
    const color = getStatusColor(status);

    if (color === "success") {
      return "border-success text-success";
    }

    if (color === "error") {
      return "border-danger text-danger";
    }

    return "border-border text-muted-foreground";
  };

  const inputClass =
    "h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20";

  if (!validId) {
    return (
      <div
        role="alert"
        className="rounded-lg border border-danger/30 bg-danger/10 p-4 text-sm text-danger"
      >
        Invalid issue ID.
      </div>
    );
  }

  if (issueQuery.isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-[100px] animate-pulse rounded-xl bg-muted" />
        <div className="h-[130px] animate-pulse rounded-xl bg-muted" />
        <div className="h-[220px] animate-pulse rounded-xl bg-muted" />
        <div className="h-[250px] animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }

  if (issueQuery.isError || !issue) {
    return (
      <div
        role="alert"
        className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-danger/30 bg-danger/10 p-4 text-sm text-danger"
      >
        <span>
          Unable to load issue details. The issue may not exist, or the server
          may be unavailable.
        </span>

        <button
          onClick={() => void issueQuery.refetch()}
          className="rounded-md px-3 py-1.5 font-semibold hover:bg-danger/10"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Back button and issue heading */}
      <div className="mb-6">
        <Link
          to={`/issues${searchParams.size ? `?${searchParams.toString()}` : ""}`}
          className="mb-4 inline-flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft size={18} />
          Back to Issues
        </Link>

        <div
          className={`rounded-xl border border-border border-l-4 bg-card ${
            issue.status === "open"
              ? "border-l-danger"
              : issue.status === "resolved"
                ? "border-l-success"
                : "border-l-muted-foreground"
          }`}
        >
          <div className="p-4 sm:p-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div className="min-w-0">
                <div className="mb-2 flex items-center gap-2">
                  <Bug size={19} className="text-danger" />

                  <span className="text-xs font-bold text-muted-foreground">
                    ISSUE #{issue.id}
                  </span>
                </div>

                <h1 className="break-words text-xl font-extrabold tracking-[-0.5px] text-foreground">
                  {issue.message}
                </h1>

                <p className="mt-2 text-sm text-muted-foreground">
                  {issue.errorType}
                </p>
              </div>

              {isAdmin ? (
                <select
                  aria-label="Issue status"
                  value={issue.status}
                  disabled={statusMutation.isPending}
                  onChange={(event) =>
                    handleStatusChange(event.target.value as IssueStatus)
                  }
                  className={`${inputClass} min-w-[160px] disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  <option value="open">Open</option>
                  <option value="resolved">Resolved</option>
                  <option value="ignored">Ignored</option>
                </select>
              ) : (
                <span
                  className={`inline-flex self-start rounded-full border px-3 py-1 text-xs font-bold capitalize sm:self-center ${getStatusStyles(issue.status)}`}
                >
                  {issue.status}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {statusMutation.isError && (
        <div
          role="alert"
          className="mb-6 flex flex-wrap items-center gap-2 rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger"
        >
          <span>Unable to update issue status. Please try again.</span>

          <button
            onClick={() => statusMutation.mutate(issue.status)}
            className="rounded-md px-2 py-1 font-semibold hover:bg-danger/10"
          >
            Retry
          </button>
        </div>
      )}

      {statusMutation.isSuccess && (
        <div
          role="status"
          className="mb-6 rounded-lg border border-success/30 bg-success/10 p-3 text-sm text-success"
        >
          Issue status updated successfully.
        </div>
      )}

      {/* Issue summary */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          title="Total Occurrences"
          value={issue.totalCount.toLocaleString()}
          icon={<Bug size={20} />}
          color="#EF4444"
        />

        <SummaryCard
          title="Affected Users"
          value={issue.affectedUsers.toLocaleString()}
          icon={<Users size={20} />}
          color="#3B82F6"
        />

        <SummaryCard
          title="First Seen"
          value={formatDate(issue.firstSeen)}
          icon={<CalendarDays size={20} />}
          color="#635BFF"
        />

        <SummaryCard
          title="Last Seen"
          value={formatDate(issue.lastSeen)}
          icon={<Clock size={20} />}
          color="#0D9488"
        />
      </div>

      {/* Stack trace */}
      <div className="mb-6 rounded-xl border border-border bg-card">
        <div className="p-4 sm:p-6">
          <h2 className="mb-1 text-lg font-bold text-foreground">
            Stack Trace
          </h2>

          <p className="mb-4 text-sm text-muted-foreground">
            Error details and execution trace
          </p>

          {issue.stackTrace ? (
            <pre className="m-0 overflow-x-auto whitespace-pre-wrap break-words rounded-lg border border-[#273449] bg-[#111827] p-4 font-mono text-xs leading-[1.8] text-[#CBD5E1] sm:p-5 dark:border-[#293249] dark:bg-[#080D18]">
              {issue.stackTrace}
            </pre>
          ) : (
            <div className="rounded-lg bg-muted/50 py-12 text-center">
              <p className="text-sm text-muted-foreground">
                No stack trace available.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Occurrence chart */}
      <div className="mb-6 rounded-xl border border-border bg-card">
        <div className="p-4 sm:p-6">
          <h2 className="text-lg font-bold text-foreground">
            Occurrence Trend
          </h2>

          <p className="mb-6 mt-1 text-sm text-muted-foreground">
            Number of times this issue occurred over time.
          </p>

          {timeseries.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-muted-foreground">
                No occurrence trend data available.
              </p>
            </div>
          ) : (
            <div className="h-[260px] w-full sm:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={timeseries}
                  margin={{ top: 10, right: 15, left: -15, bottom: 5 }}
                >
                  <CartesianGrid
                    stroke="var(--color-border)"
                    strokeDasharray="3 3"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={formatChartDate}
                    tick={{
                      fontSize: 11,
                      fill: "var(--color-muted-foreground)",
                    }}
                    axisLine={{ stroke: "var(--color-border)" }}
                    tickLine={false}
                  />

                  <YAxis
                    allowDecimals={false}
                    tick={{
                      fontSize: 11,
                      fill: "var(--color-muted-foreground)",
                    }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <Tooltip
                    labelFormatter={(value) => formatDate(String(value))}
                    contentStyle={{
                      backgroundColor: "var(--color-card)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 10,
                      color: "var(--color-foreground)",
                    }}
                  />

                  <Line
                    type="monotone"
                    dataKey="count"
                    name="Occurrences"
                    stroke="#EF4444"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Recent occurrences */}
      <div className="rounded-xl border border-border bg-card">
        <div className="p-4 sm:p-6">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-foreground">
              Recent Occurrences
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Latest recorded events for this issue
            </p>
          </div>

          {occurrences.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-muted-foreground">
                No occurrences found for this time range.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[750px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs font-semibold text-muted-foreground">
                    <th className="px-3 py-3">Timestamp</th>
                    <th className="px-3 py-3">Environment</th>
                    <th className="px-3 py-3">URL</th>
                    <th className="px-3 py-3">User ID</th>
                    <th className="px-3 py-3">Browser</th>
                  </tr>
                </thead>

                <tbody>
                  {occurrences.map((occurrence) => (
                    <tr
                      key={occurrence.id}
                      className="border-b border-border transition-colors last:border-0 hover:bg-muted/50"
                    >
                      <td className="min-w-[170px] px-3 py-4 text-foreground">
                        {formatDate(occurrence.timestamp)}
                      </td>

                      <td className="px-3 py-4">
                        <span className="inline-flex rounded-full border border-border px-2.5 py-1 text-xs font-semibold capitalize text-muted-foreground">
                          {occurrence.environment}
                        </span>
                      </td>

                      <td className="min-w-[180px] max-w-[280px] break-words px-3 py-4 text-foreground">
                        {occurrence.url || "N/A"}
                      </td>

                      <td className="px-3 py-4 text-foreground">
                        {occurrence.userId ?? "N/A"}
                      </td>

                      <td className="min-w-[140px] px-3 py-4 text-foreground">
                        {occurrence.browser ?? "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default IssueDetailPage;
