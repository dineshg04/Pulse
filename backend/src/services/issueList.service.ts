import pool from "../config/db";

interface IssueFilters {
  from: string;
  to: string;
  environment: string;
  page: number;
  limit: number;
  sortBy: "count" | "lastSeen" | "firstSeen";
  order: "asc" | "desc";
  search?: string;
  status?: "open" | "resolved" | "ignored";
}

export const getIssues = async (filters: IssueFilters) => {
  const { from, to, environment, page, limit, sortBy, order, search, status } = filters;

  const sortColumns = {
    count: "event_count",
    lastSeen: "last_seen",
    firstSeen: "first_seen",
  };

  const sortColumn = sortColumns[sortBy];
  const offset = (page - 1) * limit;

  const values = [from, to, environment, search ? `%${search}%` : null, status ?? null];

  const conditions = `
    ($3 = 'all' OR e.environment = $3)
    AND ($4::text IS NULL OR i.message ILIKE $4)
    AND ($5::text IS NULL OR i.status = $5)
  `;

  const countResult = await pool.query(
    `SELECT COUNT(*) AS total
     FROM issues i
     WHERE EXISTS (
       SELECT 1
       FROM events e
       WHERE e.issue_id = i.id
         AND e.timestamp >= $1
         AND e.timestamp <= $2
         AND ${conditions}
     )`,
    values
  );

  const result = await pool.query(
    `WITH filtered_events AS (
      SELECT
        e.issue_id,
        COUNT(*) AS event_count,
        MIN(e.timestamp) AS first_seen,
        MAX(e.timestamp) AS last_seen,
        COUNT(DISTINCT e.user_id) AS affected_users
      FROM events e
      WHERE e.timestamp >= $1
        AND e.timestamp <= $2
        AND ($3 = 'all' OR e.environment = $3)
        AND e.issue_id IS NOT NULL
      GROUP BY e.issue_id
    )
    SELECT
      i.id,
      i.error_type AS "errorType",
      i.message,
      fe.first_seen AS "firstSeen",
      fe.last_seen AS "lastSeen",
      fe.event_count AS "totalCount",
      fe.affected_users AS "affectedUsers",
      i.status
    FROM issues i
    INNER JOIN filtered_events fe ON fe.issue_id = i.id
    WHERE ($4::text IS NULL OR i.message ILIKE $4)
      AND ($5::text IS NULL OR i.status = $5)
    ORDER BY ${sortColumn} ${order.toUpperCase()}, i.id DESC
    LIMIT $6 OFFSET $7`,
    [...values.slice(0, 3), values[3], values[4], limit, offset]
  );

  return {
    data: result.rows.map((row) => ({
      ...row,
      id: Number(row.id),
      totalCount: Number(row.totalCount),
      affectedUsers: Number(row.affectedUsers),
    })),
    pagination: {
      page,
      limit,
      total: Number(countResult.rows[0].total),
      totalPages: Math.ceil(Number(countResult.rows[0].total) / limit),
    },
  };
};
