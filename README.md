# Pulse – Application Error Monitoring & Analytics Platform

## 1. Overview

Pulse is a full-stack application monitoring and analytics platform that helps developers collect, track, and analyze application errors and performance.

Applications send monitoring events to Pulse through a secure API. The backend processes these events, groups related errors into issues, and stores the information in PostgreSQL. Developers can use the dashboard to monitor application health, investigate issues, and analyze performance metrics.

## 2. Key Features

- **Authentication:** JWT-based login, bcrypt password hashing, protected routes, and Admin/Viewer roles.
- **Project Monitoring:** Project-specific API keys for securely receiving application events.
- **Event Ingestion:** API endpoint for collecting application requests and errors.
- **Error Grouping:** Groups related errors into issues and tracks their occurrences.
- **Dashboard Analytics:** Total requests, total errors, error rate, P95 response time, and affected users.
- **Issue Management:** Search, filtering, sorting, pagination, issue details, and status updates.
- **Data Visualization:** Time-series charts and top issue summaries.
- **Environment Filtering:** Monitor events across different environments and time ranges.
- **User Interface:** Responsive layout, light/dark themes, and reusable components.

## 3. Technology Stack

| Layer            | Technologies                             |
| ---------------- | ---------------------------------------- |
| Frontend         | React, TypeScript, Vite                  |
| Styling          | Tailwind CSS v4                          |
| Routing          | React Router                             |
| Server State     | TanStack Query                           |
| HTTP Client      | Axios                                    |
| Charts           | Recharts                                 |
| Icons            | Lucide React                             |
| Backend          | Node.js, Express.js, TypeScript          |
| Database         | PostgreSQL                               |
| Database Access  | node-postgres (`pg`), SQL                |
| Authentication   | JWT, bcryptjs                            |
| Validation       | Zod                                      |
| Testing          | Vitest, React Testing Library, Supertest |
| Containerization | Docker, Docker Compose                   |

## 4. Project Structure

```text
Pulse/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── ui/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── types/
│   │   └── ...
│   ├── .env
│   ├── Dockerfile
│   ├── .dockerignore
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── db/
│   │   │   ├── migrations/
│   │   │   ├── seed.ts
│   │   │   └── seed-events.ts
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── app.ts
│   │   └── server.ts
│   ├── .env.test
│   ├── Dockerfile
│   ├── .dockerignore
│   └── package.json
│
├── docker-compose.yml
├── .env
└── README.md
```

### Main Directories

**Frontend**

- `components/` – Reusable UI components.
- `hooks/` – Custom React hooks for application logic and data fetching.
- `pages/` – Dashboard, authentication, and issue pages.
- `routes/` – Application routing and protected routes.
- `services/` – API communication using Axios.
- `types/` – TypeScript interfaces and types.

**Backend**

- `config/` – Database and application configuration.
- `db/` – Database migrations and seed scripts.
- `middleware/` – Authentication, authorization, and request processing.
- `routes/` – REST API endpoint definitions.
- `services/` – Business logic for event processing, grouping, and analytics.
- `app.ts` – Express application configuration.
- `server.ts` – Database connection and server startup.

## 5. Database Schema and Indexes

Pulse uses PostgreSQL with an initial SQL migration:

`backend/src/db/migrations/001_initial_schema.sql`

The migration creates **five tables and seven indexes**.

### Main Data Entities

| Entity           | Responsibility                                               |
| ---------------- | ------------------------------------------------------------ |
| Users            | Stores user accounts, password hashes, and role information. |
| Projects         | Stores monitored project information and API key hashes.     |
| Events           | Stores incoming application monitoring events.               |
| Issues           | Stores grouped errors and their tracking information.        |
| Supporting table | Stores additional data defined by the initial migration.     |

The exact table names, columns, constraints, and relationships are defined in the SQL migration file.

### Indexing Strategy

The migration creates seven indexes to improve database query performance.

Indexes support frequently accessed monitoring data, such as:

- Retrieving events belonging to a project.
- Finding and filtering issues.
- Querying events within a time range.
- Supporting commonly used dashboard and issue queries.

Indexes improve read performance, but they also require additional storage and add overhead when records are inserted or updated.

**Note:** The migration file is the source of truth for the exact index names and indexed columns.

## 6. Important Technical Decisions and Trade-offs

| Decision              | Reason                                                              | Trade-off                                                              |
| --------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| React with TypeScript | Provides reusable UI components and better type safety.             | Requires additional type definitions and setup.                        |
| Node.js and Express   | Provides a lightweight backend for REST APIs and event processing.  | Requires organizing validation, routing, and business logic carefully. |
| PostgreSQL            | Supports relational data, constraints, indexing, and SQL analytics. | Requires database schema management and query optimization.            |
| Raw SQL with `pg`     | Provides direct control over database queries and joins.            | Requires manually maintaining SQL queries and mappings.                |
| JWT authentication    | Supports stateless authentication for protected APIs.               | Token expiration and secure storage must be handled carefully.         |
| API key hashing       | Avoids storing project API keys as plain text.                      | Requires securely managing the original key during provisioning.       |
| TanStack Query        | Handles API data fetching, caching, and loading/error states.       | Requires managing query keys and cache invalidation.                   |
| Docker Compose        | Starts the frontend, backend, and database together.                | The current configuration is intended for development, not production. |

## 7. Getting Started with Docker

### Prerequisites

- Node.js and npm
- Docker Desktop
- Git

### Step 1: Clone the Repository

```bash
git clone <your-repository-url>
cd Pulse
```

### Step 2: Configure Environment Variables

Create a root `.env` file:

```env
DB_HOST=db
DB_PORT=5432
DB_NAME=pulse
DB_USER=postgres
DB_PASSWORD=your_database_password

JWT_SECRET=your_jwt_secret

SEED_ADMIN_EMAIL=admin@example.com
SEED_ADMIN_PASSWORD=your_admin_password

SEED_VIEWER_EMAIL=viewer@example.com
SEED_VIEWER_PASSWORD=your_viewer_password

PULSE_API_KEY=your_project_api_key
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

Use your own secure values. Do not commit environment files containing secrets.

### Step 3: Start the Entire Application

Run this single command from the project root:

```bash
docker compose up --build
```

Docker Compose starts PostgreSQL, initializes the schema on a fresh database volume, waits for database readiness, runs the backend seed script, and starts the frontend.

### Application URLs

| Service     | URL                                            |
| ----------- | ---------------------------------------------- |
| Frontend    | [http://localhost:5173](http://localhost:5173) |
| Backend API | [http://localhost:5000](http://localhost:5000) |
| PostgreSQL  | localhost:5432                                 |

### Useful Docker Commands

```bash
# Start in the background
docker compose up -d

# Check running containers
docker compose ps

# View logs
docker compose logs

# View backend logs
docker compose logs backend

# Stop services
docker compose down
```

**Important:** `docker compose down -v` deletes the PostgreSQL data volume. Use it only when you intentionally want to remove the stored database data.

## 8. Running Locally Without Docker

You can also run the frontend and backend separately without Docker.

### Prerequisites

- Node.js and npm
- PostgreSQL installed and running
- Git

### Step 1: Clone the Repository

```bash
git clone <your-repository-url>
cd Pulse
```

### Step 2: Configure PostgreSQL

Create a PostgreSQL database named `pulse`.

Update the root `.env` file with your local database credentials:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pulse
DB_USER=postgres
DB_PASSWORD=your_database_password

JWT_SECRET=your_jwt_secret

SEED_ADMIN_EMAIL=admin@example.com
SEED_ADMIN_PASSWORD=your_admin_password

SEED_VIEWER_EMAIL=viewer@example.com
SEED_VIEWER_PASSWORD=your_viewer_password

PULSE_API_KEY=your_project_api_key
```

### Step 3: Initialize the Database

Execute the initial migration:

```bash
psql -U postgres -d pulse -f backend/src/db/migrations/001_initial_schema.sql
```

This creates the required database tables and indexes.

### Step 4: Install Backend Dependencies

Open a terminal:

```bash
cd backend
npm install
```

Run the user and project seed script:

```bash
npm run seed
```

Generate sample monitoring events when needed:

```bash
npm run seed:events
```

### Step 5: Start the Backend

From the backend directory:

```bash
npm run dev
```

The backend runs at:

`http://localhost:5000`

### Step 6: Configure and Start the Frontend

Open another terminal:

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

Start the frontend:

```bash
npm run dev
```

The frontend runs at:

`http://localhost:5173`

### Local Application Startup Summary

| Component             | Command                                   |
| --------------------- | ----------------------------------------- |
| PostgreSQL            | Start your local PostgreSQL service       |
| Database migration    | Run the SQL migration once                |
| User and project seed | `npm run seed` (backend)                  |
| Sample event seed     | `npm run seed:events` (backend, optional) |
| Backend               | `npm run dev` (backend)                   |
| Frontend              | `npm run dev` (frontend)                  |

**Note:** Run the database migration only when creating a fresh database. The event seed script is optional and recreates the demo project's sample events and issues.

## 7. Demo Login Credentials

The backend authentication test uses the following local test account:

| Role  | Email             | Password    |
| ----- | ----------------- | ----------- |
| Admin | `admin@pulse.com` | `admin@123` |

The seed script also creates a Viewer account using `SEED_VIEWER_EMAIL` and `SEED_VIEWER_PASSWORD` from the root `.env` file.

For a fresh local setup, use the credentials configured in your environment file. The test account above is valid only when the corresponding user exists in the database with the matching password.

**Security:** These are development-only credentials. Change them before using any production environment.

## 8. Database Initialization and Seeding

Pulse handles database initialization and user/project seeding automatically when the application starts through Docker Compose.

### Generating Sample Events Locally

For local development without Docker, start PostgreSQL and configure the backend environment variables first.

Run the following command from the backend directory:

```bash
npm run seed:events
```

This generates sample monitoring events for the demo project.

## 9. Testing

### Frontend

```bash
cd frontend

# Run tests
npm test

# Run tests once
npm run test:run
```

### Backend

```bash
cd backend

# Run tests
npm test
```

Backend tests use `.env.test` for test-specific environment configuration.

The testing setup includes frontend component tests and backend API and middleware tests.

## 10. Security

- Passwords are hashed using bcrypt.
- JWT authentication protects restricted endpoints.
- Role-based authorization controls access to protected operations.
- Project API keys are stored as SHA-256 hashes.
- Zod validates incoming request data.
- Sensitive configuration is stored in environment variables.
- Secrets and credentials should never be committed to Git.

## 11. Project Summary

Pulse demonstrates the development of a full-stack monitoring and analytics application using React, TypeScript, Node.js, Express.js, and PostgreSQL.

It brings together authentication, role-based access, API-based event ingestion, error grouping, database operations, analytics, interactive dashboards, automated testing, and Docker-based development in one application.
