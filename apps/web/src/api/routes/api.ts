import { Hono } from "hono";
import type { EnvBindings } from "../../../bindings";
import { authMiddleware } from "../lib/middleware/auth-middleware";
import { rateLimit } from "../lib/middleware/rate-limit-middleware";
import { ApiVariables } from "../lib/types";
import postCheck from "./check/post";
import getLogs from "./logs/get";
import getMonitors from "./monitors/get";
import postMonitors from "./monitors/post";
import putMonitors from "./monitors/put";
import getAllMonitors from "./monitors/get-all";
import getStatusPages from "./status-pages/get";
import postStatusPages from "./status-pages/post";
import putStatusPages from "./status-pages/put";
import getAllStatusPages from "./status-pages/get-all";
import deleteWorkspaces from "./workspaces/delete";
import getWorkspaces from "./workspaces/get";
import postWorkspaces from "./workspaces/post";
import putWorkspaces from "./workspaces/put";
import getAllWorkspaces from "./workspaces/get-all";
import deleteMonitors from "./monitors/delete";
import deleteStatusPages from "./status-pages/delete";
import getAllIncidents from "./incidents/get-all";
import getIncident from "./incidents/get";
import putIncident from "./incidents/put";

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

// Incident routes
apiRoutes.get("/api/incidents", getAllIncidents);
apiRoutes.get("/api/incidents/:id", getIncident);
apiRoutes.put("/api/incidents/:id", putIncident);

export default apiRoutes;
