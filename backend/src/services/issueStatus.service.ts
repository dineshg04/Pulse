import pool from "../config/db";

type IssueStatus = "open" | "resolved" | "ignored";

export const updateIssueStatus = async (id: number, status: IssueStatus) => {
  const result = await pool.query(
    `UPDATE issues
     SET status = $1
     WHERE id = $2
     RETURNING id, error_type AS "errorType", message, status`,
    [status, id]
  );

  return result.rows[0] ?? null;
};
