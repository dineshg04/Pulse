import { describe, it, expect } from "vitest";
import { eventSchema } from "./event.schema";

describe("Event Schema Validation", () => {
  it("should accept a valid request event", () => {
    const event = {
      type: "request",
      timestamp: "2026-11-20T10:15:30.123Z",
      environment: "production",
      route: "/api/cart",
      method: "GET",
      statusCode: 200,
      durationMs: 182,
    };

    const result = eventSchema.safeParse(event);

    expect(result.success).toBe(true);
  });

  it("should reject an event with a missing field", () => {
    const event = {
      type: "request",
      timestamp: "2026-11-20T10:15:30.123Z",
      environment: "production",
      route: "/api/cart",
      method: "GET",
      durationMs: 182,
    };

    const result = eventSchema.safeParse(event);

    expect(result.success).toBe(false);
  });

  it("should reject an invalid environment", () => {
    const event = {
      type: "request",
      timestamp: "2026-11-20T10:15:30.123Z",
      environment: "testing",
      route: "/api/cart",
      method: "GET",
      statusCode: 200,
      durationMs: 182,
    };

    const result = eventSchema.safeParse(event);

    expect(result.success).toBe(false);
  });
});
