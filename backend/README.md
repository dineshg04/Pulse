# Pulse Backend

Pulse is an error-monitoring backend built with **Node.js, Express, TypeScript, and PostgreSQL**.

It receives application request and error events, validates and stores them, groups similar errors into issues, and provides REST APIs for the monitoring dashboard.

## 1. Tech Stack

| Technology | Purpose |
|---|---|
| Node.js | JavaScript runtime |
| Express.js | REST API framework |
| TypeScript | Static typing |
| PostgreSQL | Relational database |
| pg | PostgreSQL database driver |
| Zod | Request and event validation |
| JWT | Authentication |
| bcryptjs | Password hashing |
| Vitest | Backend testing |
| Supertest | HTTP API integration testing |
| ESLint | Code quality |
| Prettier | Code formatting |

## 2. Features

- Ingest request and error events using an API key.
- Validate incoming events using Zod.
- Accept valid events while rejecting invalid events in the same batch.
- Support up to 500 events per ingestion request.
- Automatically group identical errors into issues.
- Track issue occurrences, first seen, last seen, and affected users.
- Provide overview metrics and time-series data.
- Support issue searching, filtering, sorting, and pagination.
- Display issue details and recent occurrences.
- Support admin and viewer roles.
- Allow admins to update issue status.
- Seed 100,000 realistic events for dashboard testing.

## 3. Project Structure

```text
backend/
│
├── src/
│   ├── config/
│   │   └── db.ts
│   │
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── ingest.controller.ts
│   │   ├── overview.controller.ts
│   │   ├── timeseries.controller.ts
│   │   └── issue.controller.ts
│   │
│   ├── db/
│   │   ├── migrations/
│   │   ├── seed.ts
│   │   └── seed-events.ts
│   │
│   ├── middlewares/
│   │   ├── api-key.middleware.ts
│   │   └── auth.middleware.ts
│   │
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── ingest.routes.ts
│   │   ├── overview.routes.ts
│   │   ├── timeseries.routes.ts
│   │   └── issue.routes.ts
│   │
│   ├── schemas/
│   │   └── event.schema.ts
│   │
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── event.service.ts
│   │   ├── issue.service.ts
│   │   ├── issue-list.service.ts
│   │   ├── issue-detail.service.ts
│   │   ├── overview.service.ts
│   │   └── timeseries.service.ts
│   │
│   ├── utils/
│   │   └── fingerprint.ts
│   │
│   ├── app.ts
│   └── server.ts
│
├── .env.example
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

*Test files are located alongside their corresponding source modules.*

## 4. Architecture

The backend follows a layered architecture to separate HTTP handling, business logic, and database operations.

```text
                 Client / Dashboard
                         |
                         v
                    Express App
                         |
                         v
                       Routes
                         |
                         v
                    Controllers
                         |
                         v
                      Services
                         |
                         v
                    PostgreSQL
```

### Layer responsibilities

**Routes**
- Define API endpoints.
- Attach the required middleware.
- Forward requests to controllers.

**Controllers**
- Receive HTTP requests.
- Validate request parameters and bodies.
- Return appropriate HTTP responses.

**Services**
- Handle business logic.
- Execute database queries.
- Perform error grouping and metric calculations.

**Middlewares**
- Validate project API keys.
- Authenticate users using JWT.
- Restrict admin-only operations.

**Schemas**
- Define event validation rules using Zod.

**Utils**
- Contain reusable helper functions such as error fingerprint generation.

## 5. Event Ingestion

Endpoint:

`POST /api/ingest`

Required header:

```http
X-API-Key: your_project_api_key
Content-Type: application/json
```

The endpoint accepts an array of events.

### Request event

```json
{
  "type": "request",
  "timestamp": "2026-11-20T10:15:30.123Z",
  "environment": "production",
  "route": "/api/cart",
  "method": "GET",
  "statusCode": 200,
  "durationMs": 182
}
```

### Error event

```json
{
  "type": "error",
  "timestamp": "2026-11-20T10:15:31.004Z",
  "environment": "production",
  "errorType": "TypeError",
  "message": "Cannot read properties of undefined",
  "stackTrace": "TypeError: Cannot read properties of undefined\n    at CartItem (cart.js:42:13)",
  "url": "/checkout",
  "userId": "u_1029",
  "browser": "Chrome 131"
}
```

### Validation rules

- Timestamp must be a UTC ISO 8601 string.
- Environment must be `production`, `staging`, or `development`.
- Request events must contain their request-specific fields.
- Error events must contain their error-specific fields.
- Missing or incorrectly typed required fields are rejected.
- Maximum batch size is 500 events.

### Partial batch acceptance

Each event is validated independently.

Valid events are stored, while invalid events are rejected. One invalid event does not prevent other valid events from being processed.

Example response:

```json
{
  "accepted": 2,
  "rejected": 1,
  "errors": [
    {
      "index": 2,
      "field": "statusCode",
      "message": "Required"
    }
  ]
}
```

HTTP status: `202 Accepted`

## 6. Error Grouping

Pulse groups errors into issues using a fingerprint.

The fingerprint is generated from:

1. Error type.
2. Error message.
3. First stack frame.

These three values are combined and hashed using SHA-256.

Conceptually:

```text
Fingerprint = SHA256(
  errorType + message + firstStackFrame
)
```

When a new error arrives:

- If the fingerprint does not exist, a new issue is created.
- If the fingerprint already exists, the existing issue is updated.
- The total occurrence count is incremented.
- First seen and last seen timestamps are maintained.
- Unique affected users are tracked.

This prevents identical errors from creating multiple issues.

### Issue statuses

| Status | Meaning |
|---|---|
| open | Issue needs attention |
| resolved | Issue has been fixed |
| ignored | Issue is intentionally ignored |

## 7. Database Design

Pulse uses PostgreSQL with the `pg` package for direct SQL queries.

### Main tables

**projects**

Stores project information and hashed API keys.

**users**

Stores dashboard users, password hashes, and roles.

**events**

Stores incoming request and error events.

**issues**

Stores grouped errors and their aggregated information.

**issue_affected_users**

Tracks unique users affected by each issue.

### Database relationships

```text
projects
   |
   | 1-to-many
   |
   +---------- events
   |
   +---------- issues

issues
   |
   | 1-to-many
   |
   +---------- events

issues
   |
   | 1-to-many
   |
   +---------- issue_affected_users
```

### Important indexes

Indexes are added to improve filtering, sorting, and time-range queries.

| Index | Purpose |
|---|---|
| `idx_events_project_time` | Project and timestamp filtering |
| `idx_events_project_environment_time` | Environment-based filtering |
| `idx_events_project_type_time` | Request/error filtering |
| `idx_events_issue_time` | Issue occurrence lookup |
| `idx_issues_project_status` | Issue status filtering |
| `idx_issues_project_last_seen` | Last-seen sorting |
| `idx_issues_project_count` | Occurrence-count sorting |

The issue fingerprint also has a unique constraint per project to prevent duplicate issue groups.

## 8. API Endpoints

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/login` | Authenticate a dashboard user |

Example request:

```json
{
  "email": "admin@pulse.com",
  "password": "your_password"
}
```

A successful login returns a JWT token and user information.

### Event ingestion

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/ingest` | Ingest request and error events |

Requires a valid `X-API-Key` header.

### Dashboard overview

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/overview` | Get aggregated monitoring metrics |

Query parameters:

- `from`
- `to`
- `environment`

Returns:
- Total requests.
- Total errors.
- Error rate.
- P95 response time.
- Affected users.

### Time series

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/timeseries` | Get time-bucketed event counts |

Additional query parameters:

- `metric`: `errors` or `requests`
- `interval`: `5m`, `1h`, or `1d`

### Issues

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/issues` | List and filter issues |
| GET | `/api/issues/:id` | Get issue details |
| PATCH | `/api/issues/:id` | Update issue status |

The issue list supports:

- Server-side pagination.
- Sorting by count, last seen, or first seen.
- Message search.
- Status filtering.
- Time-range filtering.
- Environment filtering.

The issue detail endpoint returns issue information, a stack trace, recent occurrences, and time-series data.

The PATCH endpoint requires admin authentication.

## 9. Authentication and Authorization

Pulse uses JSON Web Tokens for dashboard authentication.

### Login flow

1. User submits email and password.
2. Backend finds the user by email.
3. bcrypt compares the submitted password with the stored hash.
4. A JWT is generated after successful authentication.
5. The frontend uses the token for protected operations.

### Roles

| Role | Permissions |
|---|---|
| Admin | View dashboard and update issue status |
| Viewer | View dashboard and issues |

Passwords are stored as bcrypt hashes rather than plain text.

The issue status update endpoint checks the user's role and rejects viewer requests.

## 10. Environment Variables

Create a `.env` file in the backend root.

Example:

```env
PORT=5000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=pulse
DB_USER=postgres
DB_PASSWORD=your_database_password

PULSE_API_KEY=your_project_api_key
JWT_SECRET=your_jwt_secret

SEED_ADMIN_EMAIL=admin@pulse.com
SEED_ADMIN_PASSWORD=your_admin_password

SEED_VIEWER_EMAIL=viewer@pulse.com
SEED_VIEWER_PASSWORD=your_viewer_password
```

Do not commit `.env` files or real credentials to GitHub.

Refer to `.env.example` for the required variable names.

## 11. Local Setup

### Prerequisites

- Node.js
- npm
- PostgreSQL

### Step 1: Install dependencies

```bash
cd backend
npm install
```

### Step 2: Configure environment variables

Create `.env` using the variables listed above.

### Step 3: Create the database

Create a PostgreSQL database named `pulse`.

### Step 4: Run migrations

Execute the SQL migration files in `src/db/migrations` against the `pulse` database.

### Step 5: Seed users and project

```bash
npm run seed
```

### Step 6: Seed monitoring events

```bash
npm run seed:events
```

This generates at least 100,000 events across the last seven days, with approximately 95% request events and 5% error events.

### Step 7: Start the backend

```bash
npm run dev
```

The API runs at:

`http://localhost:5000`

### Health check

```http
GET /api/health
```

Expected response:

```json
{
  "success": true,
  "message": "Pulse API is running"
}
```

## 12. Testing

Pulse uses Vitest and Supertest.

Run all backend tests:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

The test suite covers:

- Event schema validation.
- Missing and invalid event fields.
- First stack frame extraction.
- Identical error fingerprint generation.
- Different error fingerprint generation.
- API key validation.
- Partial batch acceptance.
- Ingest endpoint behavior.
- Overview API end-to-end behavior.

Tests should use a separate test database to avoid modifying development data.

## 13. Code Quality

Run ESLint:

```bash
npm run lint
```

Format source files:

```bash
npm run format
```

Check formatting:

```bash
npm run format:check
```

Compile TypeScript:

```bash
npm run build
```

## 14. Performance Considerations

- Database indexes support common time-range and filtering operations.
- Aggregated metrics are calculated using PostgreSQL queries.
- Issue grouping uses a fingerprint and unique database constraint.
- Time-series queries use PostgreSQL bucket generation so empty intervals can be returned.
- Pagination is performed at the database level instead of loading every issue into application memory.

Use PostgreSQL `EXPLAIN ANALYZE` to inspect query plans for important aggregation and issue-list queries.

Example:

```sql
EXPLAIN ANALYZE
SELECT COUNT(*)
FROM events
WHERE timestamp >= NOW() - INTERVAL '7 days';
```

The assignment target for the seven-day overview query is under 500 ms on a laptop. Benchmark it using the seeded dataset and record the actual result rather than assuming it meets the target.

## 15. Technical Decisions and Tradeoffs

### PostgreSQL instead of an ORM

The project uses PostgreSQL with the `pg` package and parameterized SQL queries.

This provides direct control over aggregation queries, indexing, and PostgreSQL-specific features.

### Zod for validation

Zod provides runtime validation for incoming JSON events and allows TypeScript types to be inferred from schemas.

### Fingerprint-based issue grouping

A SHA-256 fingerprint based on error type, message, and first stack frame provides a simple and consistent way to identify similar errors.

### Database-level aggregation

Metrics and time-series calculations are performed in PostgreSQL instead of fetching large event collections and processing them in Node.js.

### Separate services and controllers

Business logic and database access are separated from HTTP request handling, making the code easier to test and maintain.

## 16. Future Improvements

- Add real-time dashboard updates.
- Add rate limiting for event ingestion.
- Add a browser SDK for automatic event capture.
- Improve error grouping with stack-trace normalization.
- Add project-level dashboard access and permissions.
- Add automated database migration tooling.
- Add CI pipelines for linting, tests, and builds.
- Add event retention and archival policies.

## 17. Project Status

Backend implementation includes event ingestion, validation, issue grouping, dashboard aggregation APIs, authentication, authorization, database seeding, and automated tests.

The React dashboard is implemented separately in the frontend directory.
