import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import app from "../app";
import pool from "../config/db";
import { createHash } from "crypto";

const API_KEY = process.env.PULSE_API_KEY!;

let projectId: number;

beforeAll(async () => {
  const apiKeyHash = createHash("sha256").update(API_KEY).digest("hex");

  const result = await pool.query(
    `INSERT INTO projects (name, api_key_hash)
     VALUES ('Pulse Test Project', $1)
     ON CONFLICT (api_key_hash)
     DO UPDATE SET name = EXCLUDED.name
     RETURNING id`,
    [apiKeyHash]
  );

  projectId = Number(result.rows[0].id);
});

afterAll(async () => {
  await pool.end();
});

describe("POST /api/ingest", () => {
  it("should reject a request without an API key", async () => {
    const response = await request(app).post("/api/ingest").send([]);

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("API key is required");
  });

  it("should reject an invalid API key", async () => {
    const response = await request(app)
      .post("/api/ingest")
      .set("X-API-Key", "invalid-key")
      .send([]);

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Invalid API key");
  });

  it("should accept valid events and reject invalid events in the same batch", async () => {
    const events = [
      {
        type: "request",
        timestamp: "2026-11-20T10:15:30.123Z",
        environment: "production",
        route: "/api/test",
        method: "GET",
        statusCode: 200,
        durationMs: 100,
      },
      {
        type: "request",
        timestamp: "2026-11-20T10:15:30.123Z",
        environment: "production",
        route: "/api/test",
        method: "GET",
        durationMs: 100,
      },
    ];

    const response = await request(app).post("/api/ingest").set("X-API-Key", API_KEY).send(events);

    expect(response.status).toBe(202);
    expect(response.body.accepted).toBe(1);
    expect(response.body.rejected).toBe(1);
    expect(response.body.errors.length).toBeGreaterThan(0);

    const storedEvent = await pool.query(
      `SELECT id FROM events
       WHERE project_id = $1 AND route = '/api/test'`,
      [projectId]
    );

    expect(storedEvent.rows.length).toBeGreaterThan(0);
  });

  it("should reject a body that is not an array", async () => {
    const response = await request(app)
      .post("/api/ingest")
      .set("X-API-Key", API_KEY)
      .send({ type: "request" });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Request body must be an array");
  });
});
