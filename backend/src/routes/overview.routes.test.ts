import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../app";

describe("GET /api/overview", () => {
  it("should return overview metrics for the selected time range", async () => {
    // Step 1: Login as admin
    const loginResponse = await request(app).post("/api/auth/login").send({
      email: "admin@pulse.com",
      password: "admin@123",
    });

    expect(loginResponse.status).toBe(200);

    const token = loginResponse.body.token;

    // Step 2: Request overview with JWT
    const response = await request(app)
      .get("/api/overview")
      .set("Authorization", `Bearer ${token}`)
      .query({
        from: "2026-11-20T00:00:00.000Z",
        to: "2026-11-21T23:59:59.999Z",
        environment: "all",
      });

    expect(response.status).toBe(200);

    expect(response.body).toHaveProperty("totalRequests");
    expect(response.body).toHaveProperty("totalErrors");
    expect(response.body).toHaveProperty("errorRate");
    expect(response.body).toHaveProperty("p95ResponseTime");
    expect(response.body).toHaveProperty("affectedUsers");
  });

  // Test 2: Missing JWT token
  it("should reject requests without a JWT token", async () => {
    const response = await request(app).get("/api/overview").query({
      from: "2026-11-20T00:00:00.000Z",
      to: "2026-11-21T23:59:59.999Z",
      environment: "all",
    });

    expect(response.status).toBe(401);
  });

  // Test 3: Invalid JWT token
  it("should reject requests with an invalid JWT token", async () => {
    const response = await request(app)
      .get("/api/overview")
      .set("Authorization", "Bearer invalid-token")
      .query({
        from: "2026-11-20T00:00:00.000Z",
        to: "2026-11-21T23:59:59.999Z",
        environment: "all",
      });

    expect(response.status).toBe(401);
  });
});
