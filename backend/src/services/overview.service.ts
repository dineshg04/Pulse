import pool from "../config/db";

interface OverviewFilters {
  from: string;
  to: string;
  environment: string;
}

export const getOverview = async (filters: OverviewFilters) => {
  const result = await pool.query(
    `SELECT
      COUNT(*) FILTER (WHERE type = 'request') AS total_requests,

      COUNT(*) FILTER (WHERE type = 'error') AS total_errors,

      percentile_cont(0.95)
        WITHIN GROUP (ORDER BY duration_ms)
        FILTER (WHERE type = 'request') AS p95_response_time,

      COUNT(DISTINCT user_id)
        FILTER (WHERE type = 'error') AS affected_users

    FROM events
    WHERE timestamp >= $1
      AND timestamp <= $2
      AND ($3 = 'all' OR environment = $3)`,
    [filters.from, filters.to, filters.environment]
  );

  const row = result.rows[0];

  const totalRequests = Number(row.total_requests);
  const totalErrors = Number(row.total_errors);

  const errorRate = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;

  return {
    totalRequests,
    totalErrors,
    errorRate: Number(errorRate.toFixed(2)),
    p95ResponseTime: row.p95_response_time === null ? null : Number(row.p95_response_time),
    affectedUsers: Number(row.affected_users),
  };
};
