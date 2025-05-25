import { Hono } from "hono";
import type { EnvBindings } from "../../../bindings";
import { authMiddleware } from "../lib/middleware/auth-middleware";
import { ApiVariables } from "../lib/types";
import postCheck from "./check/post";
import getLogs from "./logs/get";
import deleteMonitor from "./monitor/delete";
import getMonitor from "./monitor/get";
import postMonitors from "./monitor/post";
import putMonitor from "./monitor/put";
import getMonitors from "./monitors/get";
import deleteStatusPage from "./status-page/delete";
import getStatusPage from "./status-page/get";
import postStatusPage from "./status-page/post";
import putStatusPage from "./status-page/put";
import getStatusPages from "./status-pages/get";
import deleteWorkspace from "./workspace/delete";
import getWorkspace from "./workspace/get";
import postWorkspace from "./workspace/post";
import putWorkspace from "./workspace/put";
import getWorkspaces from "./workspaces/get";

const apiRoutes = new Hono<{
  Bindings: EnvBindings;
  Variables: ApiVariables;
}>();

apiRoutes.use("/api/*", authMiddleware);

apiRoutes.get("/api/test", (c) => {
  return c.text("test");
});

// Workspace routes
apiRoutes.get("/api/workspaces", getWorkspaces);
apiRoutes.post("/api/workspace", postWorkspace);
apiRoutes.get("/api/workspace/:id", getWorkspace);
apiRoutes.put("/api/workspace/:id", putWorkspace);
apiRoutes.delete("/api/workspace/:id", deleteWorkspace);

// Monitor routes
apiRoutes.post("/api/monitors", postMonitors);
apiRoutes.get("/api/monitors", getMonitors);
apiRoutes.get("/api/monitors/:id", getMonitor);
apiRoutes.put("/api/monitors/:id", putMonitor);
apiRoutes.delete("/api/monitors/:id", deleteMonitor);

// Status page routes
apiRoutes.post("/api/status-page", postStatusPage);
apiRoutes.get("/api/status-pages", getStatusPages);
apiRoutes.get("/api/status-page/:id", getStatusPage);
apiRoutes.put("/api/status-page/:id", putStatusPage);
apiRoutes.delete("/api/status-page/:id", deleteStatusPage);

apiRoutes.get("/api/logs", getLogs);
apiRoutes.post("/api/check", postCheck);

export default apiRoutes;
