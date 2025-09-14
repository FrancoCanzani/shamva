-- Authorization checks for accepted workspace members
CREATE INDEX IF NOT EXISTS idx_workspace_members_accepted_status
ON workspace_members (workspace_id, invitation_status, user_id)
WHERE invitation_status = 'accepted';

-- Logs API endpoint - highest volume table with time filtering
CREATE INDEX IF NOT EXISTS idx_logs_workspace_time
ON logs (workspace_id, created_at DESC);

-- Monitor-specific log queries
CREATE INDEX IF NOT EXISTS idx_logs_monitor_time
ON logs (monitor_id, created_at DESC);

-- Active incidents lookup for monitor checkers
CREATE INDEX IF NOT EXISTS idx_incidents_active_by_monitor
ON incidents (monitor_id, resolved_at, created_at DESC)
WHERE resolved_at IS NULL;

-- Recent incidents for dashboards
CREATE INDEX IF NOT EXISTS idx_incidents_monitor_recent
ON incidents (monitor_id, created_at DESC);

-- Workspace monitor listings
CREATE INDEX IF NOT EXISTS idx_monitors_workspace_time
ON monitors (workspace_id, created_at DESC);

-- Monitor checker cron job filtering
CREATE INDEX IF NOT EXISTS idx_monitors_status_check
ON monitors (status, last_check_at)
WHERE status NOT IN ('paused', 'maintenance');

-- Workspace heartbeat listings
CREATE INDEX IF NOT EXISTS idx_heartbeats_workspace_time
ON heartbeats (workspace_id, created_at DESC);

-- Heartbeat timeout checking for cron jobs
CREATE INDEX IF NOT EXISTS idx_heartbeats_timeout_check
ON heartbeats (updated_at, status)
WHERE status IN ('waiting', 'up');

-- Incident updates for incident detail views
CREATE INDEX IF NOT EXISTS idx_incident_updates_by_incident
ON incident_updates (incident_id, created_at DESC);
