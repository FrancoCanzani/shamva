import { Hono } from "hono";
import type { EnvBindings } from "../../../bindings";
import { authMiddleware } from "../lib/middleware/auth-middleware";
import { ApiVariables } from "../lib/types";
import postCheck from "./check/post";
import getLogs from "./logs/get";
import deleteMonitor from "./monitor/delete";
import getMonitor from "./monitor/get";
import putMonitor from "./monitor/put";
import getMonitors from "./monitors/get";
import postMonitors from "./monitors/post";

const apiRoutes = new Hono<{
  Bindings: EnvBindings;
  Variables: ApiVariables;
}>();

apiRoutes.use("/api/*", authMiddleware);

apiRoutes.get("/api/test", (c) => {
  return c.text("test");
});

apiRoutes.post("/api/monitors", postMonitors);

apiRoutes.get("/api/monitors", getMonitors);

apiRoutes.get("/api/monitors/:id", getMonitor);

apiRoutes.put("/api/monitors/:id", putMonitor);

apiRoutes.delete("/api/monitors/:id", deleteMonitor);

apiRoutes.get("/api/logs", getLogs);

apiRoutes.post("/api/check", postCheck);

export default apiRoutes;
