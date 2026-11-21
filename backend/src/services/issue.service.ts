import type { PoolClient } from "pg";
import type { EventInput } from "../schemas/event.schema";
import { createFingerprint, getFirstStackFrame } from "../utils/fingerprint";

type ErrorEvent = Extract<EventInput, { type: "error" }>;

export const groupError = async (
  client: PoolClient,
  projectId: number,
  event: ErrorEvent
): Promise<number> => {
  const firstFrame = getFirstStackFrame(event.stackTrace);

  const fingerprint = createFingerprint(event.errorType, event.message, firstFrame);

  const result = await client.query(
    `INSERT INTO issues (
      project_id,
      fingerprint,
      error_type,
      message,
      first_frame,
      latest_stack_trace,
      first_seen,
      last_seen,
      total_count
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $7, 1)
    ON CONFLICT (project_id, fingerprint)
    DO UPDATE SET
      first_seen = LEAST(issues.first_seen, EXCLUDED.first_seen),
      last_seen = GREATEST(issues.last_seen, EXCLUDED.last_seen),
      latest_stack_trace = EXCLUDED.latest_stack_trace,
      total_count = issues.total_count + 1
    RETURNING id`,
    [
      projectId,
      fingerprint,
      event.errorType,
      event.message,
      firstFrame,
      event.stackTrace,
      event.timestamp,
    ]
  );

  const issueId = Number(result.rows[0].id);

  if (event.userId) {
    const userResult = await client.query(
      `INSERT INTO issue_affected_users (issue_id, user_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [issueId, event.userId]
    );

    if (userResult.rowCount) {
      await client.query(
        `UPDATE issues
         SET affected_users = affected_users + 1
         WHERE id = $1`,
        [issueId]
      );
    }
  }

  return issueId;
};
