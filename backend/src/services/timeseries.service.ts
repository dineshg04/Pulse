import pool from "../config/db";

interface TimeseriesFilters {
  from: string;
  to: string;
  environment: string;
  metric: "errors" | "requests";
  interval: "5m" | "1h" | "1d";
}

export const getTimeseries = async (filters: TimeseriesFilters) => {
  const result = await pool.query(
    `WITH settings AS (
      SELECT
        CASE $5
          WHEN '5m' THEN date_bin(
            INTERVAL '5 minutes', $1::timestamptz, '1970-01-01'::timestamptz
          )
          WHEN '1h' THEN date_trunc('hour', $1::timestamptz)
          WHEN '1d' THEN date_trunc('day', $1::timestamptz)
        END AS start_bucket,

        CASE $5
          WHEN '5m' THEN date_bin(
            INTERVAL '5 minutes', $2::timestamptz, '1970-01-01'::timestamptz
          )
          WHEN '1h' THEN date_trunc('hour', $2::timestamptz)
          WHEN '1d' THEN date_trunc('day', $2::timestamptz)
        END AS end_bucket,

        CASE $5
          WHEN '5m' THEN INTERVAL '5 minutes'
          WHEN '1h' THEN INTERVAL '1 hour'
          WHEN '1d' THEN INTERVAL '1 day'
        END AS bucket_interval
    ),
    buckets AS (
      SELECT generate_series(
        start_bucket,
        end_bucket,
        bucket_interval
      ) AS bucket
      FROM settings
    )
    SELECT
      buckets.bucket,
      COUNT(events.id)::int AS event_count
    FROM buckets
    CROSS JOIN settings
    LEFT JOIN events
      ON events.timestamp >= GREATEST(buckets.bucket, $1::timestamptz)
      AND events.timestamp < buckets.bucket + settings.bucket_interval
      AND events.timestamp <= $2::timestamptz
      AND events.type = CASE $4
        WHEN 'errors' THEN 'error'
        WHEN 'requests' THEN 'request'
      END
      AND ($3 = 'all' OR events.environment = $3)
    GROUP BY buckets.bucket
    ORDER BY buckets.bucket`,
    [filters.from, filters.to, filters.environment, filters.metric, filters.interval]
  );

  return result.rows.map((row) => ({
    timestamp: new Date(row.bucket).toISOString(),
    count: Number(row.event_count),
  }));
};
