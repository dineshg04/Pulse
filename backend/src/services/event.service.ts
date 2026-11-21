import pool from "../config/db";
import type { EventInput } from "../schemas/event.schema";
import { groupError } from "./issue.service";
import { getFirstStackFrame } from "../utils/fingerprint";

export const storeEvent = async (projectId: number, event: EventInput): Promise<number> => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    let issueId: number | null = null;

    if (event.type === "error") {
      issueId = await groupError(client, projectId, event);
    }

    const isError = event.type === "error";

    const result = await client.query(
      `INSERT INTO events (
        project_id,
        issue_id,
        type,
        timestamp,
        environment,
        route,
        method,
        status_code,
        duration_ms,
        error_type,
        message,
        stack_trace,
        first_frame,
        url,
        user_id,
        browser
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8,
        $9, $10, $11, $12, $13, $14, $15, $16
      )
      RETURNING id`,
      [
        projectId,
        issueId,
        event.type,
        event.timestamp,
        event.environment,
        event.type === "request" ? event.route : null,
        event.type === "request" ? event.method : null,
        event.type === "request" ? event.statusCode : null,
        event.type === "request" ? event.durationMs : null,
        isError ? event.errorType : null,
        isError ? event.message : null,
        isError ? event.stackTrace : null,
        isError ? getFirstStackFrame(event.stackTrace) : null,
        isError ? (event.url ?? null) : null,
        isError ? (event.userId ?? null) : null,
        isError ? (event.browser ?? null) : null,
      ]
    );

    await client.query("COMMIT");

    return Number(result.rows[0].id);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};
