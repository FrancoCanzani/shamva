import { Monitor } from "@/frontend/lib/types";
import { Link } from "@tanstack/react-router";
import { StatusIndicator } from "./status-indicator";

interface MonitorDetailProps {
  monitor: Monitor;
}

export function MonitorDetail({ monitor }: MonitorDetailProps) {
  return (
    <div className="monitor-detail">
      <Link to="/" className="back-link">
        ← Back to monitors
      </Link>

      <div className="monitor-detail-header">
        <StatusIndicator status={monitor.status} />
        <h1>{monitor.url}</h1>
      </div>

      <div className="monitor-detail-section">
        <h2>Overview</h2>
        <div className="monitor-detail-grid">
          <div className="monitor-detail-label">Status</div>
          <div>{monitor.status}</div>

          <div className="monitor-detail-label">Method</div>
          <div>{monitor.method}</div>

          <div className="monitor-detail-label">Active</div>
          <div>{monitor.is_active ? "Yes" : "No"}</div>

          <div className="monitor-detail-label">Interval</div>
          <div>{monitor.interval} seconds</div>

          <div className="monitor-detail-label">Created</div>
          <div>{new Date(monitor.created_at).toLocaleString()}</div>

          <div className="monitor-detail-label">Last Updated</div>
          <div>{new Date(monitor.updated_at).toLocaleString()}</div>
        </div>
      </div>

      <div className="monitor-detail-section">
        <h2>Monitoring Stats</h2>
        <div className="monitor-detail-grid">
          <div className="monitor-detail-label">Success Count</div>
          <div>{monitor.success_count}</div>

          <div className="monitor-detail-label">Failure Count</div>
          <div>{monitor.failure_count}</div>

          <div className="monitor-detail-label">Last Check</div>
          <div>
            {monitor.last_check_at
              ? new Date(monitor.last_check_at).toLocaleString()
              : "Never"}
          </div>

          <div className="monitor-detail-label">Last Success</div>
          <div>
            {monitor.last_success_at
              ? new Date(monitor.last_success_at).toLocaleString()
              : "Never"}
          </div>

          <div className="monitor-detail-label">Last Failure</div>
          <div>
            {monitor.last_failure_at
              ? new Date(monitor.last_failure_at).toLocaleString()
              : "Never"}
          </div>

          {monitor.error_message && (
            <>
              <div className="monitor-detail-label">Error Message</div>
              <div>{monitor.error_message}</div>
            </>
          )}
        </div>
      </div>

      <div className="monitor-detail-section">
        <h2>Request Details</h2>
        <div className="monitor-detail-grid">
          <div className="monitor-detail-label">URL</div>
          <div>{monitor.url}</div>

          <div className="monitor-detail-label">Method</div>
          <div>{monitor.method}</div>

          <div className="monitor-detail-label">Headers</div>
          <div>
            {Object.entries(monitor.headers).length > 0 ? (
              <pre>{JSON.stringify(monitor.headers, null, 2)}</pre>
            ) : (
              "None"
            )}
          </div>

          <div className="monitor-detail-label">Body</div>
          <div>
            {monitor.body ? (
              <pre>
                {typeof monitor.body === "string"
                  ? monitor.body
                  : JSON.stringify(monitor.body, null, 2)}
              </pre>
            ) : (
              "None"
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
