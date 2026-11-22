import { useEffect, useMemo, useState, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search, Bug } from "lucide-react";

import { useIssues } from "../hooks/useIssues";

import type { Environment, IssueStatus, TimeRange } from "../types/dashboard";

import type { IssuesFilters } from "../api/issues.api";
import DataTable from "../components/ui/DataTable";

const DEFAULT_RANGE: TimeRange = "24h";
const DEFAULT_ENVIRONMENT: Environment = "all";
const DEFAULT_SORT = "count";
const DEFAULT_ORDER = "desc";
const DEFAULT_PAGE = 1;
const PAGE_SIZE = 10;

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

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

function IssuesPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const timeRange =
    (searchParams.get("range") as TimeRange | null) ?? DEFAULT_RANGE;

  const environment =
    (searchParams.get("environment") as Environment | null) ??
    DEFAULT_ENVIRONMENT;

  const page = Math.max(1, Number(searchParams.get("page")) || DEFAULT_PAGE);

  const sortBy =
    (searchParams.get("sortBy") as IssuesFilters["sortBy"] | null) ??
    DEFAULT_SORT;

  const order =
    (searchParams.get("order") as IssuesFilters["order"] | null) ??
    DEFAULT_ORDER;

  const status = (searchParams.get("status") as IssueStatus | null) ?? "";

  const searchFromUrl = searchParams.get("search") ?? "";

  const [searchInput, setSearchInput] = useState(searchFromUrl);
  const [previousSearchFromUrl, setPreviousSearchFromUrl] =
    useState(searchFromUrl);

  const debouncedSearch = useDebouncedValue(searchInput, 350);

  // Sync search input when browser navigation changes the URL.
  if (searchFromUrl !== previousSearchFromUrl) {
    setPreviousSearchFromUrl(searchFromUrl);
    setSearchInput(searchFromUrl);
  }
  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const nextParams = new URLSearchParams(searchParams);

      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === "") {
          nextParams.delete(key);
        } else {
          nextParams.set(key, value);
        }
      });

      setSearchParams(nextParams);
    },
    [searchParams, setSearchParams],
  );

  useEffect(() => {
    if (debouncedSearch === searchInput && debouncedSearch !== searchFromUrl) {
      updateParams({
        search: debouncedSearch,
        page: null,
      });
    }
  }, [debouncedSearch, searchInput, searchFromUrl, updateParams]);

  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");

  const isValidDate = (value: string | null): value is string =>
    value !== null && !Number.isNaN(Date.parse(value));

  const customRangeInvalid =
    timeRange === "custom" &&
    (!isValidDate(fromParam) ||
      !isValidDate(toParam) ||
      new Date(fromParam) > new Date(toParam));

  const dateRange = useMemo(() => {
    if (timeRange === "custom" && !customRangeInvalid) {
      return {
        from: fromParam!,
        to: toParam!,
      };
    }

    return getDateRange(timeRange === "custom" ? "24h" : timeRange);
  }, [timeRange, fromParam, toParam, customRangeInvalid]);

  const filters: IssuesFilters = {
    ...dateRange,
    environment,
    page,
    limit: PAGE_SIZE,
    sortBy,
    order,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(status ? { status } : {}),
  };

  const issuesQuery = useIssues(filters, !customRangeInvalid);

  const issues = issuesQuery.data?.data ?? [];
  const pagination = issuesQuery.data?.pagination;
  const totalPages = Math.max(1, pagination?.totalPages ?? 1);

  const handleSort = (value: IssuesFilters["sortBy"]) => {
    const nextOrder = sortBy === value && order === "desc" ? "asc" : "desc";

    updateParams({
      sortBy: value,
      order: nextOrder,
      page: null,
    });
  };

  const handleRetry = () => {
    void issuesQuery.refetch();
  };

  const formatDate = (value: string) => new Date(value).toLocaleString();

  const getStatusStyles = (value: IssueStatus) => {
    if (value === "resolved") {
      return "border-success/50 text-success";
    }

    if (value === "open") {
      return "border-danger/50 text-danger";
    }

    return "border-border text-muted-foreground";
  };
  const getEnvironmentStyles = (environment: string) => {
    if (environment === "production") {
      return "border-success/50 text-success";
    }

    if (environment === "development") {
      return "border-primary/50 text-primary";
    }

    if (environment === "staging") {
      return "border-warning/50 text-warning";
    }

    return "border-border text-muted-foreground";
  };

  const selectClass =
    "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20";

  const inputClass =
    "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20";

  const visiblePages = Array.from(
    { length: Math.min(5, totalPages) },
    (_, index) => {
      const start = Math.max(1, Math.min(page - 2, totalPages - 4));

      return start + index;
    },
  );

  return (
    <div>
      {/* Heading */}
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
          Issues
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Search, filter, and investigate application errors.
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 rounded-xl border border-border bg-card">
        <div className="p-4 sm:p-5">
          <div className="space-y-5">
            <div>
              <h2 className="text-sm font-bold text-foreground">Find issues</h2>

              <p className="text-xs text-muted-foreground">
                Search and narrow down application errors
              </p>
            </div>

            {/* Search */}
            <div className="relative">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />

              <input
                type="text"
                aria-label="Search issues"
                placeholder="Search by error message..."
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                className={`${inputClass} pl-10`}
              />
            </div>

            {/* Filter controls */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <select
                aria-label="Time Range"
                value={timeRange}
                onChange={(event) => {
                  const value = event.target.value as TimeRange;

                  updateParams({
                    range: value,
                    from: value === "custom" ? searchParams.get("from") : null,
                    to: value === "custom" ? searchParams.get("to") : null,
                    page: null,
                  });
                }}
                className={selectClass}
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
                  updateParams({
                    environment: event.target.value,
                    page: null,
                  })
                }
                className={selectClass}
              >
                <option value="all">All environments</option>
                <option value="production">Production</option>
                <option value="staging">Staging</option>
                <option value="development">Development</option>
              </select>

              <select
                aria-label="Status"
                value={status}
                onChange={(event) =>
                  updateParams({
                    status: event.target.value,
                    page: null,
                  })
                }
                className={selectClass}
              >
                <option value="">All statuses</option>
                <option value="open">Open</option>
                <option value="resolved">Resolved</option>
                <option value="ignored">Ignored</option>
              </select>

              <select
                aria-label="Sort By"
                value={sortBy}
                onChange={(event) =>
                  updateParams({
                    sortBy: event.target.value,
                    page: null,
                  })
                }
                className={selectClass}
              >
                <option value="count">Occurrence Count</option>
                <option value="lastSeen">Last Seen</option>
                <option value="firstSeen">First Seen</option>
              </select>
            </div>

            {/* Custom date range */}
            {timeRange === "custom" && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    From
                  </label>

                  <input
                    type="datetime-local"
                    value={
                      isValidDate(fromParam)
                        ? new Date(fromParam).toISOString().slice(0, 16)
                        : ""
                    }
                    onChange={(event) => {
                      const value = event.target.value;

                      updateParams({
                        from: value ? new Date(value).toISOString() : null,
                        page: null,
                      });
                    }}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    To
                  </label>

                  <input
                    type="datetime-local"
                    value={
                      isValidDate(toParam)
                        ? new Date(toParam).toISOString().slice(0, 16)
                        : ""
                    }
                    onChange={(event) => {
                      const value = event.target.value;

                      updateParams({
                        to: value ? new Date(value).toISOString() : null,
                        page: null,
                      });
                    }}
                    className={inputClass}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Custom range validation */}
      {customRangeInvalid && (
        <div
          role="alert"
          className="mb-6 rounded-lg border border-warning/30 bg-warning/10 p-4 text-sm text-warning"
        >
          Select a valid custom start and end date. The start must be earlier
          than or equal to the end.
        </div>
      )}

      {/* Error state */}
      {issuesQuery.isError && (
        <div
          role="alert"
          className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-danger/30 bg-danger/10 p-4 text-sm text-danger"
        >
          <span>Unable to load issues. Please try again.</span>

          <button
            onClick={handleRetry}
            className="rounded-md px-3 py-1.5 font-semibold hover:bg-danger/10"
          >
            Retry
          </button>
        </div>
      )}

      {/* Issues table */}
      <div className="rounded-xl border border-border bg-card">
        <div className="p-4 sm:p-6">
          {/* Table heading */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-foreground">All Issues</h2>

              <p className="text-sm text-muted-foreground">
                Review and investigate reported errors
              </p>
            </div>

            <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 px-3 py-1.5 text-xs font-semibold text-primary">
              <Bug size={15} />

              {pagination ? `${pagination.total.toLocaleString()} issues` : " "}
            </span>
          </div>

          {/* Loading state */}
          {issuesQuery.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="h-12 animate-pulse rounded-lg bg-muted"
                />
              ))}
            </div>
          ) : !issues.length ? (
            /* Empty state */
            <div className="py-16 text-center">
              <Bug
                size={42}
                className="mx-auto mb-3 text-muted-foreground/50"
              />

              <p className="font-semibold text-foreground">No issues found</p>

              <p className="mt-1 text-sm text-muted-foreground">
                Try changing your search or filters.
              </p>
            </div>
          ) : (
            <>
              {/* Table */}
              <DataTable minWidth="850px">
                  <thead>
                    <tr className="border-b border-border text-xs font-semibold text-muted-foreground">
                      <th className="px-3 py-3">Issue</th>

                      <th className="px-3 py-3">Status</th>
                      <th className="px-3 py-3">Environment</th>
                      <th className="px-3 py-3 text-right">
                        <button
                          onClick={() => handleSort("count")}
                          className="whitespace-nowrap font-semibold transition-colors hover:text-foreground"
                        >
                          Occurrences
                          {sortBy === "count"
                            ? order === "asc"
                              ? " ↑"
                              : " ↓"
                            : ""}
                        </button>
                      </th>

                      <th className="px-3 py-3 text-right">Affected Users</th>

                      <th className="px-3 py-3">
                        <button
                          onClick={() => handleSort("firstSeen")}
                          className="whitespace-nowrap font-semibold transition-colors hover:text-foreground"
                        >
                          First Seen
                          {sortBy === "firstSeen"
                            ? order === "asc"
                              ? " ↑"
                              : " ↓"
                            : ""}
                        </button>
                      </th>

                      <th className="px-3 py-3">
                        <button
                          onClick={() => handleSort("lastSeen")}
                          className="whitespace-nowrap font-semibold transition-colors hover:text-foreground"
                        >
                          Last Seen
                          {sortBy === "lastSeen"
                            ? order === "asc"
                              ? " ↑"
                              : " ↓"
                            : ""}
                        </button>
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {issues.map((issue) => (
                      <tr
                        key={issue.id}
                        className="border-b border-border transition-colors last:border-0 hover:bg-muted/50"
                      >
                        <td className="min-w-[220px] px-3 py-4">
                          <Link
                            to={`/issues/${issue.id}?${searchParams.toString()}`}
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
                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${getStatusStyles(issue.status)}`}
                          >
                            {issue.status}
                          </span>
                        </td>
                        <td className="px-3 py-4">
                          <div className="flex flex-wrap gap-1">
                            {issue.environments.map((environment) => (
                              <span
                                key={environment}
                                className={`rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground ${getEnvironmentStyles(environment)}`}
                              >
                                {environment.toUpperCase()}
                              </span>
                            ))}
                          </div>
                        </td>

                        <td className="px-3 py-4 text-right font-bold text-foreground">
                          {issue.totalCount.toLocaleString()}
                        </td>

                        <td className="px-3 py-4 text-right text-foreground">
                          {issue.affectedUsers.toLocaleString()}
                        </td>

                        <td className="min-w-[150px] px-3 py-4 text-foreground">
                          {formatDate(issue.firstSeen)}
                        </td>

                        <td className="min-w-[150px] px-3 py-4 text-foreground">
                          {formatDate(issue.lastSeen)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </DataTable>

              {/* Pagination */}
              <div className="mt-6 flex flex-col items-center justify-between gap-4 sm:flex-row">
                <p className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </p>

                <div className="flex flex-wrap items-center justify-center gap-1">
                  <button
                    disabled={page <= 1}
                    onClick={() =>
                      updateParams({
                        page: page - 1 === 1 ? null : String(page - 1),
                      })
                    }
                    className="rounded-lg border border-border px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Previous
                  </button>

                  {visiblePages.map((pageNumber) => (
                    <button
                      key={pageNumber}
                      onClick={() =>
                        updateParams({
                          page: pageNumber === 1 ? null : String(pageNumber),
                        })
                      }
                      className={`h-9 min-w-9 rounded-lg px-2 text-sm font-semibold transition-colors ${
                        pageNumber === page
                          ? "bg-primary text-white"
                          : "border border-border text-foreground hover:bg-muted"
                      }`}
                    >
                      {pageNumber}
                    </button>
                  ))}

                  <button
                    disabled={page >= totalPages}
                    onClick={() =>
                      updateParams({
                        page: String(page + 1),
                      })
                    }
                    className="rounded-lg border border-border px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default IssuesPage;
