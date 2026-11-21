import "dotenv/config";
import pool from "../config/db";
import { eventSchema, type EventInput } from "../schemas/event.schema";
import { groupError } from "../services/issue.service";
import { getFirstStackFrame } from "../utils/fingerprint";
import type { PoolClient } from "pg";

const TOTAL_EVENTS = 100_000;
const TOTAL_ERRORS = 5_000;
const BATCH_SIZE = 500;

const environments = ["production", "staging", "development"] as const;

const errorDefinitions = [
  [
    "TypeError",
    "Cannot read properties of undefined (reading 'id')",
    "at CartItem (cart.js:42:13)",
  ],
  [
    "TypeError",
    "Cannot read properties of null (reading 'name')",
    "at UserProfile (profile.js:25:8)",
  ],
  ["ReferenceError", "userData is not defined", "at getUser (user.js:18:5)"],
  [
    "TypeError",
    "Cannot read properties of undefined (reading 'map')",
    "at ProductList (products.js:32:10)",
  ],
  ["ValidationError", "Email is required", "at validateUser (validation.js:15:3)"],
  ["Error", "Database connection failed", "at connectDatabase (database.js:20:7)"],
  [
    "TypeError",
    "Cannot read properties of null (reading 'length')",
    "at CartService (cart.js:55:12)",
  ],
  ["SyntaxError", "Unexpected token in JSON", "at parseResponse (api.js:30:9)"],
  [
    "TypeError",
    "Cannot read properties of undefined (reading 'token')",
    "at authenticate (auth.js:21:4)",
  ],
  ["Error", "Payment processing failed", "at processPayment (payment.js:45:6)"],
  ["RangeError", "Maximum call stack size exceeded", "at renderComponent (render.js:12:2)"],
  [
    "TypeError",
    "Cannot read properties of undefined (reading 'email')",
    "at sendEmail (email.js:27:5)",
  ],
  ["Error", "Request timeout", "at fetchOrders (orders.js:40:8)"],
  [
    "TypeError",
    "Cannot read properties of null (reading 'price')",
    "at calculateTotal (cart.js:70:3)",
  ],
  ["Error", "File upload failed", "at uploadFile (upload.js:33:7)"],
  ["ValidationError", "Invalid phone number", "at validatePhone (validation.js:22:4)"],
  [
    "TypeError",
    "Cannot read properties of undefined (reading 'status')",
    "at checkStatus (status.js:19:6)",
  ],
  ["Error", "Redis connection refused", "at connectRedis (redis.js:16:5)"],
  [
    "TypeError",
    "Cannot read properties of null (reading 'id')",
    "at deleteProduct (product.js:28:3)",
  ],
  ["Error", "Unable to generate invoice", "at generateInvoice (invoice.js:51:9)"],
  ["SyntaxError", "Invalid regular expression", "at validateInput (input.js:14:2)"],
  [
    "TypeError",
    "Cannot read properties of undefined (reading 'address')",
    "at getAddress (address.js:37:5)",
  ],
  ["Error", "Unauthorized access", "at verifyPermission (auth.js:44:8)"],
  [
    "TypeError",
    "Cannot read properties of null (reading 'quantity')",
    "at updateStock (stock.js:29:4)",
  ],
  ["Error", "External API returned 500", "at callExternalApi (external.js:60:7)"],
  [
    "ValidationError",
    "Password must contain at least 8 characters",
    "at validatePassword (validation.js:38:3)",
  ],
  [
    "TypeError",
    "Cannot read properties of undefined (reading 'role')",
    "at checkRole (user.js:48:5)",
  ],
  ["Error", "Order creation failed", "at createOrder (order.js:73:6)"],
  [
    "TypeError",
    "Cannot read properties of null (reading 'createdAt')",
    "at formatDate (date.js:20:4)",
  ],
  ["Error", "Session expired", "at validateSession (session.js:31:8)"],
] as const;

type ErrorEvent = Extract<EventInput, { type: "error" }>;

type SeedEvent = {
  event: EventInput;
  issueId: number | null;
};

const randomItem = <T>(items: readonly T[]): T => items[Math.floor(Math.random() * items.length)];

const randomUserId = (): string => `u_${Math.floor(Math.random() * 5000) + 1}`;

const getTimestamp = (): string => {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - Math.floor(Math.random() * 7));

  // Busy hours receive more events than quiet hours.
  const hourWeights = [1, 1, 1, 1, 1, 2, 3, 5, 8, 10, 10, 9, 8, 8, 9, 10, 10, 9, 7, 5, 3, 2, 1, 1];

  const totalWeight = hourWeights.reduce((sum, weight) => sum + weight, 0);
  let random = Math.random() * totalWeight;

  let hour = 0;

  for (let i = 0; i < hourWeights.length; i++) {
    random -= hourWeights[i];

    if (random <= 0) {
      hour = i;
      break;
    }
  }

  date.setUTCHours(
    hour,
    Math.floor(Math.random() * 60),
    Math.floor(Math.random() * 60),
    Math.floor(Math.random() * 1000)
  );

  if (date.getTime() > Date.now()) {
    date.setTime(Date.now());
  }
  return date.toISOString();
};

const generateRequest = (): EventInput => ({
  type: "request",
  timestamp: getTimestamp(),
  environment: randomItem(environments),
  route: randomItem([
    "/api/cart",
    "/api/products",
    "/api/users",
    "/api/orders",
    "/api/auth/login",
    "/api/checkout",
    "/api/payments",
    "/api/profile",
    "/api/notifications",
    "/api/invoices",
  ]),
  method: randomItem(["GET", "POST", "PUT", "PATCH", "DELETE"]),
  statusCode: randomItem([200, 200, 200, 201, 204, 400, 401, 404, 500]),
  durationMs: Math.floor(Math.random() * 1500) + 20,
});

const generateError = (): ErrorEvent => {
  const [errorType, message, firstFrame] = randomItem(errorDefinitions);

  return {
    type: "error",
    timestamp: getTimestamp(),
    environment: randomItem(environments),
    errorType,
    message,
    stackTrace: `${errorType}: ${message}\n    ${firstFrame}\n    at processRequest (server.js:80:5)`,
    url: randomItem(["/checkout", "/products", "/cart", "/login", "/profile"]),
    userId: randomUserId(),
    browser: randomItem(["Chrome 131", "Firefox 132", "Safari 18", "Edge 131"]),
  };
};

const insertEvents = async (client: PoolClient, projectId: number, events: SeedEvent[]) => {
  for (let start = 0; start < events.length; start += BATCH_SIZE) {
    const batch = events.slice(start, start + BATCH_SIZE);
    const values: unknown[] = [];

    const placeholders = batch.map(({ event, issueId }, index) => {
      const offset = index * 16;

      const isRequest = event.type === "request";
      const isError = event.type === "error";

      values.push(
        projectId,
        issueId,
        event.type,
        event.timestamp,
        event.environment,
        isRequest ? event.route : null,
        isRequest ? event.method : null,
        isRequest ? event.statusCode : null,
        isRequest ? event.durationMs : null,
        isError ? event.errorType : null,
        isError ? event.message : null,
        isError ? event.stackTrace : null,
        isError ? getFirstStackFrame(event.stackTrace) : null,
        isError ? (event.url ?? null) : null,
        isError ? (event.userId ?? null) : null,
        isError ? (event.browser ?? null) : null
      );

      return `(${Array.from({ length: 16 }, (_, i) => `$${offset + i + 1}`).join(", ")})`;
    });

    await client.query(
      `INSERT INTO events (
        project_id, issue_id, type, timestamp, environment,
        route, method, status_code, duration_ms,
        error_type, message, stack_trace, first_frame,
        url, user_id, browser
      ) VALUES ${placeholders.join(", ")}`,
      values
    );

    console.log(`Inserted ${Math.min(start + BATCH_SIZE, events.length)} / ${events.length}`);
  }
};

const seedEvents = async () => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const projectResult = await client.query("SELECT id FROM projects WHERE name = $1 LIMIT 1", [
      "Pulse Demo",
    ]);

    if (!projectResult.rows.length) {
      throw new Error("Pulse Demo project not found. Run npm run seed first.");
    }

    const projectId = Number(projectResult.rows[0].id);

    // Remove the previous demo events before regenerating them.
    await client.query("DELETE FROM events WHERE project_id = $1", [projectId]);
    await client.query("DELETE FROM issues WHERE project_id = $1", [projectId]);

    const events: SeedEvent[] = [];

    for (let i = 0; i < TOTAL_EVENTS; i++) {
      const rawEvent = i < TOTAL_EVENTS - TOTAL_ERRORS ? generateRequest() : generateError();

      const validation = eventSchema.safeParse(rawEvent);

      if (!validation.success) {
        throw new Error(
          `Generated event ${i} is invalid: ${JSON.stringify(validation.error.issues)}`
        );
      }

      events.push({
        event: validation.data,
        issueId: null,
      });
    }

    // Group errors and obtain their issue IDs.
    for (const item of events) {
      if (item.event.type === "error") {
        item.issueId = await groupError(client, projectId, item.event);
      }
    }

    await insertEvents(client, projectId, events);

    await client.query("COMMIT");

    console.log("Seed completed successfully");
    console.log(`Total events: ${TOTAL_EVENTS}`);
    console.log(`Request events: ${TOTAL_EVENTS - TOTAL_ERRORS}`);
    console.log(`Error events: ${TOTAL_ERRORS}`);
    console.log(`Error kinds: ${errorDefinitions.length}`);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

seedEvents().catch((error) => {
  console.error("Event seeding failed:", error);
  process.exit(1);
});
