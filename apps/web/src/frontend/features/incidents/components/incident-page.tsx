import { Button } from "@/frontend/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/frontend/components/ui/dialog";
import { Separator } from "@/frontend/components/ui/separator";
import { Route } from "@/frontend/routes/dashboard/$workspaceName/incidents/$id";
import { getRegionFlags } from "@/frontend/utils/utils";
import { Link, useRouteContext, useRouter } from "@tanstack/react-router";
import { format, formatDistanceToNowStrict, parseISO } from "date-fns";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import {
  useAcknowledgeIncident,
  useCreateIncidentUpdate,
  useDeleteIncidentUpdate,
  useResolveIncident,
} from "../api/mutations";
import { IncidentWithUpdates } from "../types";
import IncidentTimeline from "./incident-timeline";
import { IncidentUpdateEditor } from "./incident-update-editor";
import { IncidentUpdatesSection } from "./incident-updates-section";

export default function IncidentPage() {
  const { workspaceName, id } = Route.useParams();
  const incident = Route.useLoaderData() as IncidentWithUpdates;
  const router = useRouter();
  const { auth } = useRouteContext({
    from: "/dashboard/$workspaceName/incidents/$id/",
  });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  const acknowledgeMutation = useAcknowledgeIncident();
  const resolveMutation = useResolveIncident();
  const updateMutation = useCreateIncidentUpdate();
  const deleteUpdateMutation = useDeleteIncidentUpdate();

  const getIncidentStatus = (incident: IncidentWithUpdates) => {
    if (incident.resolved_at) {
      return { status: "resolved", label: "Resolved", color: "bg-green-600" };
    }
    if (incident.acknowledged_at) {
      return {
        status: "acknowledged",
        label: "Acknowledged",
        color: "bg-yellow-600",
      };
    }
    return { status: "active", label: "Active", color: "bg-red-600" };
  };

  const getDuration = (startedAt: string) => {
    const start = parseISO(startedAt);
    return formatDistanceToNowStrict(start, { addSuffix: false });
  };

  const formatEventTime = (timeString: string) => {
    const time = parseISO(timeString);
    return format(time, "MMM d, HH:mm:ss");
  };

  const status = getIncidentStatus(incident);
  const duration = getDuration(incident.started_at);

  const timelineEvents = [
    {
      id: "started",
      title: "Incident Started",
      time: incident.started_at,
      description: "The incident was first detected",
      color: "bg-red-700",
    },
    ...(incident.notified_at
      ? [
          {
            id: "notified",
            title: "Notifications Sent",
            time: incident.notified_at,
            description: "Team members were notified",
            color: "bg-orange-500",
          },
        ]
      : []),
    ...(incident.acknowledged_at
      ? [
          {
            id: "acknowledged",
            title: "Incident Acknowledged",
            time: incident.acknowledged_at,
            description: "The incident was acknowledged by the team",
            color: "bg-yellow-500",
          },
        ]
      : []),
    ...(incident.resolved_at
      ? [
          {
            id: "resolved",
            title: "Incident Resolved",
            time: incident.resolved_at,
            description: "The incident was resolved",
            color: "bg-green-700",
          },
        ]
      : []),
  ];

  return (
    <div>
      <div className="mx-auto max-w-6xl p-4">
        <Link
          to="/dashboard/$workspaceName/monitors/$id"
          params={{ workspaceName, id: incident.monitor_id }}
          search={{ days: 7 }}
          className="text-muted-foreground mb-6 flex items-center justify-start gap-1 text-xs"
        >
          <ArrowLeft className="size-3" />
          <span className="hover:underline">Back to Monitor</span>
        </Link>
        <div className="flex flex-col gap-8 lg:flex-row">
          <div className="order-2 min-w-0 flex-1 space-y-6 lg:order-1">
            <div className="rounded border p-4 shadow-xs">
              <div className="mb-4 flex items-start justify-between">
                <div className="space-y-3">
                  <h1 className="tracking-widetight font-mono text-xl font-medium uppercase">
                    {status.label.toUpperCase()} incident
                  </h1>
                  {incident.regions_affected &&
                    incident.regions_affected.length > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground tracking-widewide font-mono text-xs uppercase">
                          Affected regions:
                        </span>
                        <div className="flex items-center gap-1">
                          {getRegionFlags(incident.regions_affected)}
                        </div>
                      </div>
                    )}
                  <p className="text-muted-foreground font-mono text-xs">
                    STARTED {formatEventTime(incident.started_at).toUpperCase()}{" "}
                    ({duration.toUpperCase()})
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {status.status === "active" && (
                    <Button
                      onClick={async () => {
                        await acknowledgeMutation.mutateAsync(id);
                        await router.invalidate();
                      }}
                      disabled={acknowledgeMutation.isPending}
                      size="xs"
                      variant={"outline"}
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
                      variant={"outline"}
                    >
                      {resolveMutation.isPending ? "Resolving..." : "Resolve"}
                    </Button>
                  )}
                </div>
              </div>
              {incident.monitors?.error_message && (
                <div className="dark:bg-background rounded border border-red-300 bg-red-50 p-3 shadow-xs dark:border-red-900">
                  <p className="tracking-widewide font-mono text-xs text-red-900">
                    {incident.monitors.error_message.toUpperCase()}
                  </p>
                </div>
              )}
            </div>

            {incident.screenshot_url && (
              <img
                src={incident.screenshot_url}
                alt="Incident screenshot"
                className="w-full rounded border shadow-xs lg:hidden"
              />
            )}

            <div className="lg:hidden">
              <IncidentTimeline events={timelineEvents} />
            </div>

            <div className="rounded border p-4 shadow-xs">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-mono text-sm font-medium">UPDATES</h2>
                <Button
                  variant={"outline"}
                  size={"xs"}
                  onClick={() => setShowEditor(!showEditor)}
                >
                  {showEditor ? "Close editor" : "New Update"}
                </Button>
              </div>
              {showEditor && (
                <>
                  <IncidentUpdateEditor
                    onSubmit={async (content) => {
                      if (!auth.session?.user) return;
                      await updateMutation.mutateAsync({
                        incidentId: id,
                        data: {
                          content,
                          author_name:
                            auth.session.user.user_metadata?.name ||
                            auth.session.user.email ||
                            "",
                          author_email: auth.session.user.email || "",
                        },
                      });
                      await router.invalidate();
                      setShowEditor(false);
                    }}
                    loading={updateMutation.isPending}
                  />
                  <Separator className="my-6" />
                </>
              )}
              <IncidentUpdatesSection
                updates={incident.updates || []}
                onDelete={async (updateId) => {
                  setDeletingId(updateId);
                  try {
                    await deleteUpdateMutation.mutateAsync({
                      incidentId: id,
                      updateId,
                    });
                    await router.invalidate();
                  } finally {
                    setDeletingId(null);
                  }
                }}
                deletingId={deletingId || undefined}
              />
            </div>
          </div>
          <div className="lg order-1 hidden space-y-4 lg:order-2 lg:block">
            {incident.screenshot_url && (
              <Dialog>
                <DialogTrigger className="group flex w-80 flex-col items-start rounded border p-4 shadow-xs">
                  <h2 className="mb-4 font-mono text-sm font-medium">
                    Screenshot
                  </h2>
                  <div className="relative">
                    <span className="absolute inset-0 z-10 flex items-center justify-center rounded bg-stone-50 font-mono text-xs font-medium opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:bg-stone-800 dark:text-white">
                      Click to expand
                    </span>
                    <img
                      src={incident.screenshot_url}
                      alt="Incident screenshot"
                      className="w-80 rounded transition-all duration-200 group-hover:blur-xs"
                    />
                  </div>
                </DialogTrigger>
                <DialogContent>
                  <img
                    src={incident.screenshot_url}
                    alt="Incident screenshot"
                    className="w-full rounded border shadow-xs"
                  />
                </DialogContent>
              </Dialog>
            )}
            <IncidentTimeline events={timelineEvents} />
          </div>
        </div>
      </div>
    </div>
  );
}
