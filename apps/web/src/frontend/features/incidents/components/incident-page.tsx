import { Button } from "@/frontend/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/frontend/components/ui/dialog";
import { Separator } from "@/frontend/components/ui/separator";
import { getRegionNameFromCode } from "@/frontend/lib/utils";
import { Route } from "@/frontend/routes/dashboard/$workspaceName/incidents/$id";
import { Link, useRouter } from "@tanstack/react-router";
import { format, formatDistanceToNowStrict, parseISO } from "date-fns";
import { ArrowLeft } from "lucide-react";
import { useAcknowledgeIncident, useResolveIncident } from "../api/mutations";
import { IncidentWithUpdates } from "../types";
import IncidentPostMortem from "./incident-post-mortem";
import IncidentUpdates from "./incident-updates";

export default function IncidentPage() {
  const { workspaceName, id } = Route.useParams();
  const incident = Route.useLoaderData() as IncidentWithUpdates;
  const router = useRouter();

  const acknowledgeMutation = useAcknowledgeIncident();
  const resolveMutation = useResolveIncident();

  const getIncidentStatus = (incident: IncidentWithUpdates) => {
    if (incident.resolved_at) {
      return { status: "resolved", label: "Resolved", color: "text-green-600" };
    }
    if (incident.acknowledged_at) {
      return {
        status: "acknowledged",
        label: "Acknowledged",
        color: "text-yellow-600",
      };
    }
    return { status: "active", label: "Active", color: "text-red-600" };
  };

  const getDuration = (startedAt: string) => {
    const start = parseISO(startedAt);
    return formatDistanceToNowStrict(start, { addSuffix: false });
  };

  const status = getIncidentStatus(incident);
  const duration = getDuration(incident.started_at);

  const startedAt = parseISO(incident.started_at);
  const startedDate = format(startedAt, "MMM d");
  const startedTime = format(startedAt, "HH:mm:ss");

  const postMortem = (incident.post_mortem || "").trim();

  return (
    <div className="flex h-full flex-col">
      <div className="mx-auto w-full max-w-4xl flex-1 space-y-8 p-6">
        <Link
          to="/dashboard/$workspaceName/monitors/$id"
          params={{ workspaceName, id: incident.monitor_id }}
          search={{ days: 7 }}
          className="text-muted-foreground flex items-center gap-1 text-xs hover:underline"
        >
          <ArrowLeft className="size-3" />
          Back to Monitor
        </Link>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <span className="font-medium">{status.label} incident</span>

            <div className="flex items-center gap-3">
              {incident.screenshot_url && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="xs">
                      Screenshot
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl">
                    <img
                      src={incident.screenshot_url}
                      alt="Incident screenshot"
                      className="w-full rounded"
                    />
                  </DialogContent>
                </Dialog>
              )}
              {status.status === "active" && (
                <Button
                  onClick={async () => {
                    await acknowledgeMutation.mutateAsync(id);
                    await router.invalidate();
                  }}
                  disabled={acknowledgeMutation.isPending}
                  size="xs"
                  variant="outline"
                >
                  {acknowledgeMutation.isPending
                    ? "Acknowledging..."
                    : "Acknowledge"}
                </Button>
              )}
              {status.status === "acknowledged" && (
                <Button
                  onClick={async () => {
                    await resolveMutation.mutateAsync(id);
                    await router.invalidate();
                  }}
                  disabled={resolveMutation.isPending}
                  size="xs"
                  variant="outline"
                >
                  {resolveMutation.isPending ? "Resolving..." : "Resolve"}
                </Button>
              )}
            </div>
          </div>

          <div className="flex flex-col items-start justify-between space-y-1.5 lg:flex-row lg:space-y-0">
            <div className="flex items-center gap-3">
              <span className="text-muted-foreground text-xs">
                Started {startedDate}, <span>{startedTime}</span> (
                <span>{duration}</span>)
              </span>
            </div>

            {incident.regions_affected &&
              incident.regions_affected.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-muted-foreground">
                    Affected regions:
                  </span>
                  <span>
                    {incident.regions_affected
                      .map((code) => getRegionNameFromCode(code))
                      .join(", ")}
                  </span>
                </div>
              )}
          </div>

          {(incident.error_message || incident.monitors?.error_message) && (
            <div className="space-y-1.5">
              <h3 className="text-xs font-medium">Error</h3>
              <div className="dark:border-border rounded border border-red-200 bg-red-50 p-3 dark:bg-stone-950">
                <p className="text-xs text-red-800 dark:text-red-50">
                  {(
                    incident.error_message || incident.monitors?.error_message
                  )?.toUpperCase()}
                </p>
              </div>
            </div>
          )}

          <Separator />

          <IncidentPostMortem incidentId={id} contentHtml={postMortem} />

          <Separator />

          <IncidentUpdates incidentId={id} updates={incident.updates || []} />
        </div>
      </div>
    </div>
  );
}
