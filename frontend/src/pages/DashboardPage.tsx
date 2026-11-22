import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  TrendingUp,
  Bug,
  Gauge,
  Users,
  ChartNoAxesCombined,
} from "lucide-react";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  useOverview,
  useTimeseries,
  useTopIssues,
} from "../hooks/useDashboard";

import type { Environment, TimeRange } from "../types/dashboard";

function getDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

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

function getCustomDateRange(fromDate: string, toDate: string) {
  const from = new Date(`${fromDate}T00:00:00`);
  const to = new Date(`${toDate}T23:59:59.999`);

  return {
    from: from.toISOString(),
    to: to.toISOString(),
  };
}

interface KpiCardProps {
  title: string;
  value: string;
  description?: string;
  loading: boolean;
  icon: React.ReactNode;
  color: string;
}

function KpiCard({
  title,
  value,
  description,
  loading,
  icon,
  color,
}: KpiCardProps) {
  return (
    <div
      className="h-full rounded-xl border border-border border-t-[3px] bg-card text-card-foreground transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_12px_28px_rgba(15,23,42,0.09)] dark:hover:shadow-[0_12px_28px_rgba(0,0,0,0.3)]"
      style={{ borderTopColor: color }}
    >
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

        {loading ? (
          <div className="mt-3 h-[45px] w-[65%] animate-pulse rounded-md bg-muted" />
        ) : (
          <p className="mt-3 break-words text-3xl font-extrabold tracking-[-1px] text-foreground">
            {value}
          </p>
        )}

        {description && (
          <p className="mt-2 block text-xs text-muted-foreground">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

function DashboardPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>("custom");

  const [environment, setEnvironment] = useState<Environment>("all");

  const today = getDateInputValue(new Date());

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const [customFrom, setCustomFrom] = useState(getDateInputValue(yesterday));

  const [customTo, setCustomTo] = useState(today);

  const [appliedCustomRange, setAppliedCustomRange] = useState<{
    from: string;
    to: string;
  } | null>(null);

  const isCustomRangeInvalid =
    timeRange === "custom" &&
    (!customFrom || !customTo || customFrom > customTo);

  const shouldFetch = timeRange !== "custom" || appliedCustomRange !== null;

  const dateRange = useMemo(() => {
    if (timeRange === "custom") {
      if (appliedCustomRange) {
        return getCustomDateRange(
          appliedCustomRange.from,
          appliedCustomRange.to,
        );
      }

      return getDateRange("24h");
    }

    return getDateRange(timeRange);
  }, [timeRange, appliedCustomRange]);

  const filters = useMemo(
    () => ({
      ...dateRange,
      environment,
    }),
    [dateRange, environment],
  );

  const interval = timeRange === "1h" ? "5m" : "1h";

  const overviewQuery = useOverview(
    filters,
    shouldFetch && !isCustomRangeInvalid,
  );

  const requestsQuery = useTimeseries(
    filters,
    "requests",
    interval,
    shouldFetch && !isCustomRangeInvalid,
  );

  const errorsQuery = useTimeseries(
    filters,
    "errors",
    interval,
    shouldFetch && !isCustomRangeInvalid,
  );

  const topIssuesQuery = useTopIssues(
    filters,
    shouldFetch && !isCustomRangeInvalid,
  );

  const chartData = useMemo(() => {
    const dataMap = new Map<
      string,
      { timestamp: string; requests: number; errors: number }
    >();

    requestsQuery.data?.data.forEach((point) => {
      dataMap.set(point.timestamp, {
        timestamp: point.timestamp,
        requests: point.count,
        errors: 0,
      });
    });

    errorsQuery.data?.data.forEach((point) => {
      const existing = dataMap.get(point.timestamp);

      if (existing) {
        existing.errors = point.count;
      } else {
        dataMap.set(point.timestamp, {
          timestamp: point.timestamp,
          requests: 0,
          errors: point.count,
        });
      }
    });

    return Array.from(dataMap.values()).sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );
  }, [requestsQuery.data, errorsQuery.data]);

  const isLoading =
    overviewQuery.isLoading ||
    requestsQuery.isLoading ||
    errorsQuery.isLoading ||
    topIssuesQuery.isLoading;

  const hasError =
    overviewQuery.isError ||
    requestsQuery.isError ||
    errorsQuery.isError ||
    topIssuesQuery.isError;

  const handleRetry = () => {
    void Promise.all([
      overviewQuery.refetch(),
      requestsQuery.refetch(),
      errorsQuery.refetch(),
      topIssuesQuery.refetch(),
    ]);
  };

  const handleApplyCustomRange = () => {
    if (isCustomRangeInvalid) return;

    setAppliedCustomRange({
      from: customFrom,
      to: customTo,
    });
  };

  const overview = overviewQuery.data;

  const formatNumber = (value: number | null | undefined) => {
    if (value === null || value === undefined) return "N/A";
    return value.toLocaleString();
  };

  const formatDate = (value: string) => new Date(value).toLocaleString();

  const formatChartDate = (value: string) =>
    new Date(value).toLocaleString([], {
      ...(timeRange === "7d" || timeRange === "custom"
        ? { day: "2-digit", month: "short" }
        : {}),
      hour: "2-digit",
      minute: "2-digit",
    });

  const getStatusColor = (status: string) => {
    if (status === "resolved") return "success";
    if (status === "open") return "error";
    return "default";
  };

  const statusStyles = (status: string) => {
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

  const isReadyToDisplay = shouldFetch && !isCustomRangeInvalid;

  return (
    <div>
      {/* Heading */}
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-[-1px] text-foreground">
          Overview
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Monitor your application's performance and error activity.
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 rounded-xl border border-border bg-card">
        <div className="p-4 sm:p-5">
          <div className="flex flex-col flex-wrap gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-bold text-foreground">
                Dashboard filters
              </p>

              <p className="text-xs text-muted-foreground">
                Select a period and environment
              </p>
            </div>

            <div className="flex-1" />

            <select
              aria-label="Time Range"
              value={timeRange}
              onChange={(event) =>
                setTimeRange(event.target.value as TimeRange)
              }
              className={`${inputClass} min-w-[150px]`}
            >
              <option value="1h">Last 1 hour</option>
              <option value="24h">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
              <option value="custom">Custom range</option>
            </select>

            <select
              aria-label="Environment"
              value={environment}
              onChange={(event) =>
                setEnvironment(event.target.value as Environment)
              }
              className={`${inputClass} min-w-[150px]`}
            >
              <option value="all">All environments</option>
              <option value="production">Production</option>
              <option value="staging">Staging</option>
              <option value="development">Development</option>
            </select>
          </div>

          {/* Custom date range */}
          {timeRange === "custom" && (
            <div className="mt-4 flex flex-col items-start gap-4 sm:flex-row sm:items-end">
              <label className="flex w-full flex-col gap-1.5 text-sm text-muted-foreground sm:w-auto">
                From
                <input
                  type="date"
                  value={customFrom}
                  max={customTo || undefined}
                  onChange={(event) => setCustomFrom(event.target.value)}
                  className={inputClass}
                />
              </label>

              <label className="flex w-full flex-col gap-1.5 text-sm text-muted-foreground sm:w-auto">
                To
                <input
                  type="date"
                  value={customTo}
                  min={customFrom || undefined}
                  onChange={(event) => setCustomTo(event.target.value)}
                  className={inputClass}
                />
              </label>

              <button
                onClick={handleApplyCustomRange}
                disabled={isCustomRangeInvalid}
                className="h-10 rounded-lg bg-primary px-5 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Apply
              </button>
            </div>
          )}

          {isCustomRangeInvalid && (
            <div
              role="alert"
              className="mt-4 rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-warning"
            >
              Please select valid dates. The start date must not be after the
              end date.
            </div>
          )}
        </div>
      </div>

      {/* Initial custom range message */}
      {!isReadyToDisplay && !isCustomRangeInvalid && (
        <div className="mb-6 rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm text-muted-foreground">
          Select your date range and click Apply to load dashboard data.
        </div>
      )}

      {/* Error state */}
      {isReadyToDisplay && hasError && (
        <div
          role="alert"
          className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-danger/30 bg-danger/10 p-4 text-sm text-danger"
        >
          <span>Unable to load dashboard data. Please try again.</span>

          <button
            onClick={handleRetry}
            className="rounded-md px-3 py-1.5 font-semibold transition-colors hover:bg-danger/10"
          >
            Retry
          </button>
        </div>
      )}

      {/* KPI cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard
          title="Total Requests"
          value={formatNumber(overview?.totalRequests)}
          loading={isReadyToDisplay && isLoading}
          color="#635BFF"
          icon={<TrendingUp size={21} />}
        />

        <KpiCard
          title="Total Errors"
          value={formatNumber(overview?.totalErrors)}
          loading={isReadyToDisplay && isLoading}
          color="#EF4444"
          icon={<Bug size={21} />}
        />

        <KpiCard
          title="Error Rate"
          value={overview ? `${overview.errorRate.toFixed(2)}%` : "N/A"}
          loading={isReadyToDisplay && isLoading}
          color="#F59E0B"
          icon={<ChartNoAxesCombined size={21} />}
        />

        <KpiCard
          title="P95 Response Time"
          value={
            overview?.p95ResponseTime != null
              ? `${overview.p95ResponseTime.toFixed(0)} ms`
              : "N/A"
          }
          loading={isReadyToDisplay && isLoading}
          color="#0D9488"
          icon={<Gauge size={21} />}
        />

        <KpiCard
          title="Affected Users"
          value={formatNumber(overview?.affectedUsers)}
          loading={isReadyToDisplay && isLoading}
          color="#3B82F6"
          icon={<Users size={21} />}
        />
      </div>

      {/* Trend chart */}
      <div className="mb-6 rounded-xl border border-border bg-card">
        <div className="p-4 sm:p-6">
          <h2 className="text-lg font-bold text-foreground">
            Request and Error Trends
          </h2>

          <p className="mb-6 mt-1 text-sm text-muted-foreground">
            Request volume and application errors over time.
          </p>

          {!isReadyToDisplay ? (
            <div className="flex h-[280px] items-center justify-center">
              <p className="text-sm text-muted-foreground">
                Apply a date range to view the trend chart.
              </p>
            </div>
          ) : isLoading ? (
            <div className="h-[320px] w-full animate-pulse rounded-lg bg-muted" />
          ) : chartData.length === 0 ? (
            <div className="flex h-[280px] items-center justify-center">
              <p className="text-sm text-muted-foreground">
                No trend data available for this time range.
              </p>
            </div>
          ) : (
            <div className="h-[260px] w-full sm:h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
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
                    minTickGap={30}
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
                    labelFormatter={(label) => formatDate(String(label))}
                    contentStyle={{
                      backgroundColor: "var(--color-card)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 10,
                      color: "var(--color-foreground)",
                    }}
                  />

                  <Legend />

                  <Line
                    type="monotone"
                    dataKey="requests"
                    name="Requests"
                    stroke="#635BFF"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 5 }}
                  />

                  <Line
                    type="monotone"
                    dataKey="errors"
                    name="Errors"
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

      {/* Top issues */}
      <div className="rounded-xl border border-border bg-card">
        <div className="p-4 sm:p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-foreground">Top Issues</h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Most frequently occurring application errors.
              </p>
            </div>

            <Link
              to="/issues"
              className="rounded-lg border border-primary px-3 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/10"
            >
              View All Issues
            </Link>
          </div>

          {!isReadyToDisplay ? (
            <div className="py-12 text-center">
              <p className="text-sm text-muted-foreground">
                Apply a date range to view top issues.
              </p>
            </div>
          ) : topIssuesQuery.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="h-[45px] animate-pulse rounded-lg bg-muted"
                />
              ))}
            </div>
          ) : topIssuesQuery.isError ? (
            <div
              role="alert"
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger"
            >
              <span>Unable to load top issues.</span>

              <button
                onClick={() => void topIssuesQuery.refetch()}
                className="rounded-md px-3 py-1.5 font-semibold hover:bg-danger/10"
              >
                Retry
              </button>
            </div>
          ) : !topIssuesQuery.data?.data.length ? (
            <div className="py-12 text-center">
              <p className="text-sm text-muted-foreground">
                No issues found for this time range.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[750px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs font-semibold text-muted-foreground">
                    <th className="px-3 py-3">Issue</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3 text-right">Occurrences</th>
                    <th className="px-3 py-3 text-right">Affected Users</th>
                    <th className="px-3 py-3">Last Seen</th>
                  </tr>
                </thead>

                <tbody>
                  {topIssuesQuery.data.data.map((issue) => (
                    <tr
                      key={issue.id}
                      className="border-b border-border transition-colors last:border-0 hover:bg-muted/50"
                    >
                      <td className="min-w-[220px] px-3 py-4">
                        <Link
                          to={`/issues/${issue.id}`}
                          className="break-words font-semibold text-foreground transition-colors hover:text-primary hover:underline"
                        >
                          {issue.message}
                        </Link>

                        <p className="mt-1 text-xs text-muted-foreground">
                          {issue.errorType}
                        </p>
                      </td>

                      <td className="px-3 py-4">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${statusStyles(issue.status)}`}
                        >
                          {issue.status}
                        </span>
                      </td>

                      <td className="px-3 py-4 text-right font-bold text-foreground">
                        {issue.totalCount.toLocaleString()}
                      </td>

                      <td className="px-3 py-4 text-right text-foreground">
                        {issue.affectedUsers.toLocaleString()}
                      </td>

                      <td className="min-w-[150px] px-3 py-4 text-foreground">
                        {formatDate(issue.lastSeen)}
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

export default DashboardPage;
