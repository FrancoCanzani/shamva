import { Hono } from "hono";
import type { EnvBindings } from "../../../bindings";
import { authMiddleware } from "../lib/middleware/auth-middleware";
import { rateLimit } from "../lib/middleware/rate-limit-middleware";
import { ApiVariables } from "../lib/types";
import postCheck from "./check/post";
import deleteIncidentUpdate from "./incidents/delete-incident-update";
import getIncident from "./incidents/get";
import getAllIncidents from "./incidents/get-all";
import postIncidentUpdate from "./incidents/post-incident-update";
import putIncident from "./incidents/put";
import getLogs from "./logs/get";
import deleteMonitors from "./monitors/delete";
import getMonitors from "./monitors/get";
import getAllMonitors from "./monitors/get-all";
import patchMonitors from "./monitors/patch";
import postMonitors from "./monitors/post";
import putMonitors from "./monitors/put";
import deleteStatusPages from "./status-pages/delete";
import getStatusPages from "./status-pages/get";
import getAllStatusPages from "./status-pages/get-all";
import postStatusPages from "./status-pages/post";
import putStatusPages from "./status-pages/put";
import deleteWorkspaces from "./workspaces/delete";
import getWorkspaces from "./workspaces/get";
import getAllWorkspaces from "./workspaces/get-all";
import postWorkspaces from "./workspaces/post";
import putWorkspaces from "./workspaces/put";
import getHeartbeat from "./heartbeat/get";
import getAllHeartbeats from "./heartbeat/get-all";
import postHeartbeat from "./heartbeat/post";
import putHeartbeat from "./heartbeat/put";
import deleteHeartbeat from "./heartbeat/delete";

const apiRoutes = new Hono<{
  Bindings: EnvBindings;
  Variables: ApiVariables;
}>();

// Apply auth and rate limiting to all API routes
apiRoutes.use("/api/*", authMiddleware, rateLimit());

// Test endpoint
apiRoutes.get("/api/test", (c) => {
  return c.json({ status: "ok" });
});

// Workspace routes
apiRoutes.get("/api/workspaces", getAllWorkspaces);
apiRoutes.post("/api/workspaces", postWorkspaces);
apiRoutes.get("/api/workspaces/:id", getWorkspaces);
apiRoutes.put("/api/workspaces/:id", putWorkspaces);
apiRoutes.delete("/api/workspaces/:id", deleteWorkspaces);

// Monitor routes
apiRoutes.post("/api/monitors", postMonitors);
apiRoutes.get("/api/monitors", getAllMonitors);
apiRoutes.get("/api/monitors/:id", getMonitors);
apiRoutes.put("/api/monitors/:id", putMonitors);
apiRoutes.patch("/api/monitors/:id", patchMonitors);
apiRoutes.delete("/api/monitors/:id", deleteMonitors);

// Status page routes
apiRoutes.post("/api/status-pages", postStatusPages);
apiRoutes.get("/api/status-pages", getAllStatusPages);
apiRoutes.get("/api/status-pages/:id", getStatusPages);
apiRoutes.put("/api/status-pages/:id", putStatusPages);
apiRoutes.delete("/api/status-pages/:id", deleteStatusPages);

// Logs and check routes
apiRoutes.get("/api/logs", getLogs);
apiRoutes.post("/api/check", postCheck);

// Heartbeat routes
apiRoutes.get("/api/heartbeat", getHeartbeat); // No auth required for heartbeat endpoint
apiRoutes.get("/api/heartbeats", getAllHeartbeats);
apiRoutes.post("/api/heartbeats", postHeartbeat);
apiRoutes.put("/api/heartbeats/:id", putHeartbeat);
apiRoutes.delete("/api/heartbeats/:id", deleteHeartbeat);

// Incident routes
apiRoutes.get("/api/incidents", getAllIncidents);
apiRoutes.get("/api/incidents/:id", getIncident);
apiRoutes.put("/api/incidents/:id", putIncident);
apiRoutes.post("/api/incidents/:id/updates", postIncidentUpdate);
apiRoutes.delete("/api/incidents/:id/updates/:updateId", deleteIncidentUpdate);

export default apiRoutes;
