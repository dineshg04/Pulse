
-- Projects
CREATE TABLE projects (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    api_key_hash TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Dashboard users
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'viewer')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Grouped errors
CREATE TABLE issues (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL REFERENCES projects(id),
    fingerprint CHAR(64) NOT NULL,
    error_type VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    first_frame TEXT NOT NULL,
    latest_stack_trace TEXT,
    first_seen TIMESTAMPTZ NOT NULL,
    last_seen TIMESTAMPTZ NOT NULL,
    total_count BIGINT NOT NULL DEFAULT 0,
    affected_users BIGINT NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'open'
        CHECK (status IN ('open', 'resolved', 'ignored')),
    UNIQUE (project_id, fingerprint)
);

-- Individual events
CREATE TABLE events (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL REFERENCES projects(id),
    issue_id BIGINT REFERENCES issues(id),

    type VARCHAR(20) NOT NULL
        CHECK (type IN ('request', 'error')),

    timestamp TIMESTAMPTZ NOT NULL,
    environment VARCHAR(20) NOT NULL
        CHECK (environment IN ('production', 'staging', 'development')),

    route TEXT,
    method VARCHAR(20),
    status_code INTEGER,
    duration_ms NUMERIC,

    error_type VARCHAR(255),
    message TEXT,
    stack_trace TEXT,
    first_frame TEXT,

    url TEXT,
    user_id VARCHAR(255),
    browser VARCHAR(255),

    metadata JSONB DEFAULT '{}'
);

-- Unique users affected by each issue
CREATE TABLE issue_affected_users (
    issue_id BIGINT NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL,
    PRIMARY KEY (issue_id, user_id)
);




-- Events: time-based filtering
CREATE INDEX idx_events_project_time
ON events (project_id, occurred_at DESC);

-- Events: environment filtering
CREATE INDEX idx_events_project_environment_time
ON events (project_id, environment, occurred_at DESC);

-- Events: event type filtering
CREATE INDEX idx_events_project_type_time
ON events (project_id, event_type, occurred_at DESC);

-- Events: issue occurrences
CREATE INDEX idx_events_issue_time
ON events (issue_id, occurred_at DESC);

-- Issues: project and status filtering
CREATE INDEX idx_issues_project_status
ON issues (project_id, status);

-- Issues: issue sorting
CREATE INDEX idx_issues_project_last_seen
ON issues (project_id, last_seen DESC);

CREATE INDEX idx_issues_project_count
ON issues (project_id, total_count DESC);
