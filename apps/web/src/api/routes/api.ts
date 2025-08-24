import { OpenAPIHono } from "@hono/zod-openapi";
import type { EnvBindings } from "../../../bindings";
import { authMiddleware } from "../lib/middleware/auth-middleware";
import { rateLimit } from "../lib/middleware/rate-limit-middleware";
import { ApiVariables } from "../lib/types";
import postCheck from "./api/check/post";
import deleteCollectors from "./api/collectors/delete";
import getCollector from "./api/collectors/get";
import getAllCollectors from "./api/collectors/get-all";
import postCollectors from "./api/collectors/post";
import putCollectors from "./api/collectors/put";
import postFeedback from "./api/feedback/post";
import deleteHeartbeat from "./api/heartbeat/delete";
import getHeartbeat from "./api/heartbeat/get";
import getAllHeartbeats from "./api/heartbeat/get-all";
import postHeartbeat from "./api/heartbeat/post";
import putHeartbeat from "./api/heartbeat/put";
import deleteIncidentUpdate from "./api/incidents/delete-incident-update";
import getIncident from "./api/incidents/get";
import getAllIncidents from "./api/incidents/get-all";
import postIncidentUpdate from "./api/incidents/post-incident-update";
import putIncident from "./api/incidents/put";
import { registerGetLogs } from "./api/logs/get.openapi";
import deleteMonitors from "./api/monitors/delete";
import getMonitors from "./api/monitors/get";
import getAllMonitors from "./api/monitors/get-all";
import patchMonitors from "./api/monitors/patch";
import postMonitors from "./api/monitors/post";
import putMonitors from "./api/monitors/put";
import deleteStatusPages from "./api/status-pages/delete";
import getStatusPages from "./api/status-pages/get";
import getAllStatusPages from "./api/status-pages/get-all";
import postStatusPages from "./api/status-pages/post";
import putStatusPages from "./api/status-pages/put";
import deleteWorkspaces from "./api/workspaces/delete";
import getWorkspaces from "./api/workspaces/get";
import getAllWorkspaces from "./api/workspaces/get-all";
import getWorkspaceNotifications from "./api/workspaces/notifications/get";
import putWorkspaceNotifications from "./api/workspaces/notifications/put";
import postWorkspaces from "./api/workspaces/post";
import putWorkspaces from "./api/workspaces/put";

const apiRoutes = new OpenAPIHono<{
  Bindings: EnvBindings;
  Variables: ApiVariables;
}>();

// Apply auth and rate limiting to all API routes
apiRoutes.use("/*", authMiddleware, rateLimit());

// Workspace routes
apiRoutes.get("/workspaces", getAllWorkspaces);
apiRoutes.post("/workspaces", postWorkspaces);
apiRoutes.get("/workspaces/:id", getWorkspaces);
apiRoutes.put("/workspaces/:id", putWorkspaces);
apiRoutes.delete("/workspaces/:id", deleteWorkspaces);

// Workspace notification routes
apiRoutes.get("/workspaces/:id/notifications", getWorkspaceNotifications);
apiRoutes.put("/workspaces/:id/notifications", putWorkspaceNotifications);

// Monitor routes
apiRoutes.post("/monitors", postMonitors);
apiRoutes.get("/monitors", getAllMonitors);
apiRoutes.get("/monitors/:id", getMonitors);
apiRoutes.put("/monitors/:id", putMonitors);
apiRoutes.patch("/monitors/:id", patchMonitors);
apiRoutes.delete("/monitors/:id", deleteMonitors);

// Collector routes
apiRoutes.post("/collectors", postCollectors);
apiRoutes.get("/collectors", getAllCollectors);
apiRoutes.get("/collectors/:id", getCollector);
apiRoutes.put("/collectors/:id", putCollectors);
apiRoutes.delete("/collectors/:id", deleteCollectors);

// Status page routes
apiRoutes.post("/status-pages", postStatusPages);
apiRoutes.get("/status-pages", getAllStatusPages);
apiRoutes.get("/status-pages/:id", getStatusPages);
apiRoutes.put("/status-pages/:id", putStatusPages);
apiRoutes.delete("/status-pages/:id", deleteStatusPages);

// Logs and check routes
registerGetLogs(apiRoutes);
apiRoutes.post("/check", postCheck);

// Heartbeat routes
apiRoutes.get("/heartbeat", getHeartbeat); // No auth required for heartbeat endpoint
apiRoutes.get("/heartbeats", getAllHeartbeats);
apiRoutes.post("/heartbeats", postHeartbeat);
apiRoutes.put("/heartbeats/:id", putHeartbeat);
apiRoutes.delete("/heartbeats/:id", deleteHeartbeat);

// Incident routes
apiRoutes.get("/incidents", getAllIncidents);
apiRoutes.get("/incidents/:id", getIncident);
apiRoutes.put("/incidents/:id", putIncident);
apiRoutes.post("/incidents/:id/updates", postIncidentUpdate);
apiRoutes.delete("/incidents/:id/updates/:updateId", deleteIncidentUpdate);

// Feedback routes
apiRoutes.post("/feedback", postFeedback);

// OpenAPI docs
apiRoutes.doc("/docs", {
  openapi: "3.0.0",
  info: { title: "Shamva API", version: "1.0.0" },
});

export default apiRoutes;
