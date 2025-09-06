import { OpenAPIHono } from "@hono/zod-openapi";
import type { EnvBindings } from "../../../../bindings";
import { authMiddleware } from "../../lib/middleware/auth-middleware";
import { rateLimit } from "../../lib/middleware/rate-limit-middleware";
import { ApiVariables } from "../../lib/types";
import registerDeleteCollectors from "./collectors/delete";
import registerGetCollector from "./collectors/get";
import registerGetAllCollectors from "./collectors/get-all";
import registerPostCollectors from "./collectors/post";
import registerPutCollectors from "./collectors/put";
import registerPostFeedback from "./feedback/post";
import registerDeleteHeartbeat from "./heartbeats/delete";
import registerGetAllHeartbeats from "./heartbeats/get-all";
import registerPostHeartbeat from "./heartbeats/post";
import registerPutHeartbeat from "./heartbeats/put";
import registerDeleteIncidentUpdate from "./incidents/delete-incident-update";
import registerGetIncident from "./incidents/get";
import registerGetAllIncidents from "./incidents/get-all";
import registerPostIncidentUpdate from "./incidents/post-incident-update";
import registerPutIncident from "./incidents/put";
import registerGetLogs from "./logs/get";
import registerDeleteMonitor from "./monitors/delete";
import registerGetMonitor from "./monitors/get";
import registerGetAllMonitors from "./monitors/get-all";
import registerPatchMonitor from "./monitors/patch";
import registerPostMonitor from "./monitors/post";
import registerPutMonitor from "./monitors/put";
import registerGetProfile from "./profiles/get";
import registerPutProfile from "./profiles/put";
import registerDeleteStatusPage from "./status-pages/delete";
import registerGetStatusPage from "./status-pages/get";
import registerGetAllStatusPages from "./status-pages/get-all";
import registerPostStatusPage from "./status-pages/post";
import registerPutStatusPage from "./status-pages/put";
import registerDeleteWorkspaces from "./workspaces/delete";
import registerGetWorkspace from "./workspaces/get";
import registerGetAllWorkspaces from "./workspaces/get-all";
import registerGetWorkspaceNotifications from "./workspaces/notifications/get";
import registerPutWorkspaceNotifications from "./workspaces/notifications/put";
import registerPostWorkspaces from "./workspaces/post";
import registerPutWorkspaces from "./workspaces/put";

const apiRoutes = new OpenAPIHono<{
  Bindings: EnvBindings;
  Variables: ApiVariables;
}>();

// Apply auth and rate limiting to all API routes
apiRoutes.use("/*", authMiddleware, rateLimit());

// Workspace routes
registerGetAllWorkspaces(apiRoutes);
registerPostWorkspaces(apiRoutes);
registerGetWorkspace(apiRoutes);
registerPutWorkspaces(apiRoutes);
registerDeleteWorkspaces(apiRoutes);

// Workspace notification routes
registerGetWorkspaceNotifications(apiRoutes);
registerPutWorkspaceNotifications(apiRoutes);

// Monitor routes
registerPostMonitor(apiRoutes);
registerGetAllMonitors(apiRoutes);
registerGetMonitor(apiRoutes);
registerDeleteMonitor(apiRoutes);
registerPutMonitor(apiRoutes);
registerPatchMonitor(apiRoutes);

// Collector routes
registerPostCollectors(apiRoutes);
registerGetAllCollectors(apiRoutes);
registerGetCollector(apiRoutes);
registerPutCollectors(apiRoutes);
registerDeleteCollectors(apiRoutes);

// Status page routes
registerPostStatusPage(apiRoutes);
registerGetAllStatusPages(apiRoutes);
registerGetStatusPage(apiRoutes);
registerPutStatusPage(apiRoutes);
registerDeleteStatusPage(apiRoutes);

// Logs and check routes
registerGetLogs(apiRoutes);

// Heartbeat routes
registerGetAllHeartbeats(apiRoutes);
registerPostHeartbeat(apiRoutes);
registerPutHeartbeat(apiRoutes);
registerDeleteHeartbeat(apiRoutes);

// Incident routes
registerGetAllIncidents(apiRoutes);
registerGetIncident(apiRoutes);
registerPutIncident(apiRoutes);
registerPostIncidentUpdate(apiRoutes);
registerDeleteIncidentUpdate(apiRoutes);

// Feedback routes
registerPostFeedback(apiRoutes);

// Profile routes
registerGetProfile(apiRoutes);
registerPutProfile(apiRoutes);

export default apiRoutes;
