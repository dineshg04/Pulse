import pool from "../config/db";

interface IssueDetailFilters {
  id: number;
  from: string;
  to: string;
  environment: string;
}

export const getIssueDetail = async (filters: IssueDetailFilters) => {
  const { id, from, to, environment } = filters;

  // Get issue information and metrics for the selected filters.
  const issueResult = await pool.query(
    `SELECT
      i.id,
      i.error_type AS "errorType",
      i.message,
      i.status,
      i.latest_stack_trace AS "stackTrace",
      MIN(e.timestamp) AS "firstSeen",
      MAX(e.timestamp) AS "lastSeen",
      COUNT(e.id) AS "totalCount",
      COUNT(DISTINCT e.user_id) AS "affectedUsers"
    FROM issues i
    LEFT JOIN events e
      ON e.issue_id = i.id
      AND e.timestamp >= $2
      AND e.timestamp <= $3
      AND ($4 = 'all' OR e.environment = $4)
    WHERE i.id = $1
    GROUP BY i.id`,
    [id, from, to, environment]
  );

  if (issueResult.rows.length === 0) {
    return null;
  }

  // Get the latest 20 occurrences.
  const occurrencesResult = await pool.query(
    `SELECT
      id,
      timestamp,
      environment,
      url,
      user_id AS "userId",
      browser
    FROM events
    WHERE issue_id = $1
      AND timestamp >= $2
      AND timestamp <= $3
      AND ($4 = 'all' OR environment = $4)
    ORDER BY timestamp DESC
    LIMIT 20`,
    [id, from, to, environment]
  );

  // Generate hourly buckets for the issue chart.
  const timeseriesResult = await pool.query(
    `WITH settings AS (
      SELECT
        date_bin(
          INTERVAL '1 hour',
          $2::timestamptz,
          '1970-01-01'::timestamptz
        ) AS start_bucket,
        date_bin(
          INTERVAL '1 hour',
          $3::timestamptz,
          '1970-01-01'::timestamptz
        ) AS end_bucket
    ),
    buckets AS (
      SELECT generate_series(
        start_bucket,
        end_bucket,
        INTERVAL '1 hour'
      ) AS bucket
      FROM settings
    )
    SELECT
      buckets.bucket AS timestamp,
      COUNT(e.id)::int AS count
    FROM buckets
    LEFT JOIN events e
      ON e.issue_id = $1
      AND e.timestamp >= GREATEST(buckets.bucket, $2::timestamptz)
      AND e.timestamp < buckets.bucket + INTERVAL '1 hour'
      AND e.timestamp <= $3::timestamptz
      AND ($4 = 'all' OR e.environment = $4)
    GROUP BY buckets.bucket
    ORDER BY buckets.bucket`,
    [id, from, to, environment]
  );

  const issue = issueResult.rows[0];

  return {
    issue: {
      ...issue,
      id: Number(issue.id),
      totalCount: Number(issue.totalCount),
      affectedUsers: Number(issue.affectedUsers),
    },
    occurrences: occurrencesResult.rows.map((row) => ({
      ...row,
      id: Number(row.id),
    })),
    timeseries: timeseriesResult.rows.map((row) => ({
      timestamp: new Date(row.timestamp).toISOString(),
      count: Number(row.count),
    })),
  };
};
