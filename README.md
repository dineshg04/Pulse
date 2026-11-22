# Pulse – Application Error Monitoring & Analytics Platform

## 1. Project Overview

**Pulse** is a full-stack application monitoring and analytics platform designed to collect, track, and analyze application events and errors.

It provides developers with a centralized dashboard to monitor application health, identify frequently occurring errors, analyze performance metrics, and track issues across different environments.

Applications can send monitoring events to Pulse through a secure API endpoint using project-specific API keys. The backend processes these events, groups related errors into issues, and stores the data in PostgreSQL. The frontend presents this information through interactive dashboards, charts, and issue management interfaces.

## 2. Key Objectives

- Build a centralized platform for monitoring application errors and events.
- Provide secure authentication and role-based access.
- Support project-specific event ingestion through API keys.
- Group similar errors to make issue tracking easier.
- Display application health and performance metrics.
- Provide filtering, searching, sorting, and pagination for issues.
- Build a responsive and user-friendly monitoring dashboard.

## 3. Features

### Authentication and Authorization
- JWT-based user authentication.
- Password hashing using bcrypt.
- Admin and Viewer roles.
- Protected frontend routes.
- Role-based authorization for restricted operations.

### Project Management and Event Ingestion
- Project-based monitoring.
- Unique API keys for individual projects.
- Secure API key validation.
- SHA-256 hashing of API keys before storing them in the database.
- API endpoint for receiving application events.
- Support for tracking errors and application requests.

### Error Processing and Issue Management
- Automatic grouping of related errors.
- Issue tracking with occurrence counts.
- Affected-user tracking.
- Issue status management.
- Search and filtering by status, environment, and time range.
- Sorting and pagination.
- Detailed issue views with relevant event information.

### Monitoring Dashboard
- Total requests.
- Total errors.
- Error rate.
- P95 response time.
- Affected users.
- Time-series charts for monitoring trends.
- Top issues based on occurrence frequency.
- Environment-based filtering.
- Predefined and custom date-range filtering.

### User Interface
- Responsive dashboard layout.
- Light and dark themes.
- Interactive charts.
- Reusable UI components.
- Loading, error, and empty states.
- Consistent navigation and filtering experience.

## 4. Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React, TypeScript, Vite |
| Styling | Tailwind CSS v4 |
| Routing | React Router |
| Server State | TanStack Query |
| HTTP Client | Axios |
| Charts | Recharts |
| Icons | Lucide React |
| Backend | Node.js, Express.js, TypeScript |
| Database | PostgreSQL |
| Database Access | node-postgres (`pg`), SQL |
| Authentication | JWT, bcryptjs |
| Validation | Zod |
| Testing | Vitest, React Testing Library, Supertest |
| Containerization | Docker, Docker Compose |

## 5. System Architecture

Pulse follows a three-layer architecture.

### Frontend Layer
The React application provides the user interface for authentication, project monitoring, dashboard analytics, and issue management. It communicates with the backend through REST APIs.

### Backend Layer
The Express.js application handles authentication, authorization, API key validation, event ingestion, error grouping, and analytics processing.

### Database Layer
PostgreSQL stores user accounts, projects, application events, and grouped issues. SQL queries are used to retrieve and aggregate monitoring data.

### Application Event Flow

1. An application sends an event to the Pulse event ingestion API.
2. The backend validates the project's API key.
3. The event is processed and relevant information is extracted.
4. Related errors are grouped into issues.
5. Event and issue information is stored in PostgreSQL.
6. The frontend requests monitoring data through REST APIs.
7. The dashboard displays metrics, charts, and issue information.

## 6. Project Structure

```text
Pulse/
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
│   ├── Dockerfile
│   ├── .dockerignore
│   └── package.json
│
├── docker-compose.yml
├── .env
└── README.md
```

## 7. Getting Started

### Prerequisites

Install the following before running the project locally:

- Node.js
- npm
- Docker Desktop
- Git

### Step 1: Clone the Repository

```bash
git clone <your-repository-url>
cd Pulse
```

### Step 2: Configure Environment Variables

Create a `.env` file in the project root.

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

Create a `.env` file inside the frontend directory:

```env
VITE_API_URL=http://localhost:5000/api
```

Use your own values for credentials and secrets. Never commit actual environment files containing secrets.

### Step 3: Start the Application

From the project root, run:

```bash
docker compose up --build
```

This starts the application services:

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:5000 |
| PostgreSQL | localhost:5432 |

### Step 4: Verify the Services

```bash
docker compose ps
```

To view application logs:

```bash
docker compose logs
```

To view backend logs:

```bash
docker compose logs backend
```

## 8. Database Initialization and Seeding

Pulse uses PostgreSQL for persistent data storage.

The initial database migration is located at:

```text
backend/src/db/migrations/001_initial_schema.sql
```

During the first initialization of the PostgreSQL data volume, Docker mounts and executes this SQL migration to create the required database tables and indexes.

The backend seed script creates or updates the initial user accounts and demo project.

The application also includes a separate event seed script for generating sample monitoring data.

To generate sample events manually:

```bash
docker compose exec backend npm run seed:events
```

**Note:** The event seed script recreates the demo project's events and issues. Run it only when you want to regenerate the sample data.

## 9. Testing

Pulse includes testing tools for frontend and backend functionality.

### Frontend

```bash
cd frontend
npm test
```

To run tests once:

```bash
npm run test:run
```

### Backend

```bash
cd backend
npm test
```

The backend test configuration uses `.env.test` for its test environment.

Testing covers application components and API functionality, including authentication and middleware behavior.

## 10. Docker Setup

Docker Compose manages the application's services:

- **Database:** Runs PostgreSQL and initializes the database schema.
- **Backend:** Waits for the database health check, executes the seed script, and starts the Express server.
- **Frontend:** Starts the Vite development server and communicates with the backend API.

Useful Docker commands:

```bash
# Start all services
docker compose up

# Build and start services
docker compose up --build

# Start in detached mode
docker compose up -d

# Check running containers
docker compose ps

# View logs
docker compose logs

# Stop services
docker compose down
```

**Important:** `docker compose down -v` also removes the PostgreSQL data volume. Use it only when you intentionally want to delete the persisted database data.

The current Docker configuration is intended for local development, not production deployment.

## 11. Security Considerations

- Passwords are hashed using bcrypt before database storage.
- JWT is used to authenticate users.
- Protected routes and backend authorization middleware restrict access.
- Project API keys are hashed using SHA-256 before being stored.
- Zod validates incoming request data.
- Environment variables are used for sensitive configuration.
- Database credentials and application secrets should not be committed to version control.

## 13. Project Summary

Pulse is a full-stack application monitoring and analytics platform built using React, TypeScript, Node.js, Express.js, and PostgreSQL.

The project demonstrates the implementation of secure authentication, role-based access control, API-based event ingestion, error grouping, database operations, analytics APIs, interactive dashboards, automated testing, and Docker-based development.

It brings application monitoring, error tracking, and performance analytics together in a single platform.