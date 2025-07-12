import { Button } from "@/frontend/components/ui/button";
import { useAuth } from "@/frontend/lib/context/auth-context";
import type { Incident as IncidentBase } from "@/frontend/lib/types";
import { getRegionFlags } from "@/frontend/lib/utils";
import { Route } from "@/frontend/routes/dashboard/$workspaceName/incidents/$id";
import { useMutation } from "@tanstack/react-query";
import { Link, useRouter } from "@tanstack/react-router";
import { format, formatDistanceToNowStrict, parseISO } from "date-fns";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import IncidentTimeline from "../incidents/incident-timeline";
import { IncidentUpdateEditor } from "../incidents/incident-update-editor";
import { IncidentUpdatesSection } from "../incidents/incident-updates-section";
import { Dialog, DialogContent, DialogTrigger } from "../ui/dialog";
import { Separator } from "../ui/separator";

interface IncidentUpdate {
  id: string;
  author: string;
  author_name?: string;
  author_email?: string;
  content: string;
  created_at: string;
  author_id?: string;
}

type Incident = IncidentBase & { updates?: IncidentUpdate[] };

export default function IncidentPage() {
  const { workspaceName, id } = Route.useParams();
  const incident = Route.useLoaderData() as Incident;
  const router = useRouter();
  const { session } = useAuth();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  const acknowledgeMutation = useMutation({
    mutationFn: async () => {
      if (!session?.access_token) {
        throw new Error("Authentication error. Please log in again.");
      }
      const response = await fetch(`/api/incidents/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ acknowledged_at: new Date().toISOString() }),
      });
      if (!response.ok) throw new Error("Failed to acknowledge incident");
    },
    onSuccess: async () => {
      toast.success("Incident acknowledged");
      await router.invalidate();
    },
    onError: () => toast.error("Failed to acknowledge incident"),
  });

  const resolveMutation = useMutation({
    mutationFn: async () => {
      if (!session?.access_token) {
        throw new Error("Authentication error. Please log in again.");
      }
      const response = await fetch(`/api/incidents/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ resolved_at: new Date().toISOString() }),
      });
      if (!response.ok) throw new Error("Failed to resolve incident");
    },
    onSuccess: async () => {
      toast.success("Incident resolved");
      await router.invalidate();
    },
    onError: () => toast.error("Failed to resolve incident"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ content }: { content: string }) => {
      if (!session?.access_token || !session?.user)
        throw new Error("Not authenticated");
      const res = await fetch(`/api/incidents/${id}/updates`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          content,
          author_name:
            session.user.user_metadata?.name || session.user.email || "",
          author_email: session.user.email || "",
        }),
      });
      if (!res.ok) throw new Error("Failed to post update");
      return res.json();
    },
    onSuccess: async () => {
      toast.success("Update posted");
      await router.invalidate();
      setShowEditor(false);
    },
    onError: (error) => {
      toast.error("Failed to post update");
      console.error(error);
    },
  });

  const deleteUpdateMutation = useMutation({
    mutationFn: async (updateId: string) => {
      if (!session?.access_token) throw new Error("Not authenticated");
      const res = await fetch(`/api/incidents/${id}/updates/${updateId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to delete update");
      return res.json();
    },
    onMutate: (updateId: string) => {
      setDeletingId(updateId);
    },
    onSettled: () => {
      setDeletingId(null);
    },
    onSuccess: async () => {
      toast.success("Update deleted");
      await router.invalidate();
    },
    onError: () => toast.error("Failed to delete update"),
  });

  const getIncidentStatus = (incident: Incident) => {
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
            <div className="rounded-md border p-4 shadow-xs">
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
                      onClick={() => acknowledgeMutation.mutate()}
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
                      onClick={() => resolveMutation.mutate()}
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
                <div className="dark:bg-background rounded-md border border-red-300 bg-red-50 p-3 shadow-xs dark:border-red-900">
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
                className="w-full rounded-md border shadow-xs lg:hidden"
              />
            )}

            <div className="lg:hidden">
              <IncidentTimeline events={timelineEvents} />
            </div>

            <div className="rounded-md border p-4 shadow-xs">
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
                      if (!session?.user) return;
                      await updateMutation.mutateAsync({ content });
                    }}
                    loading={updateMutation.isPending}
                  />
                  <Separator className="my-6" />
                </>
              )}
              <IncidentUpdatesSection
                updates={incident.updates || []}
                onDelete={(updateId) => deleteUpdateMutation.mutate(updateId)}
                deletingId={deletingId || undefined}
              />
            </div>
          </div>
          <div className="lg order-1 hidden space-y-4 lg:order-2 lg:block">
            {incident.screenshot_url && (
              <Dialog>
                <DialogTrigger className="group flex w-80 flex-col items-start rounded-md border p-4 shadow-xs">
                  <h2 className="mb-4 font-mono text-sm font-medium">
                    Screenshot
                  </h2>
                  <div className="relative">
                    <span className="bg-carbon-50 dark:bg-carbon-800 absolute inset-0 z-10 flex items-center justify-center rounded-md font-mono text-xs font-medium opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:text-white">
                      Click to expand
                    </span>
                    <img
                      src={incident.screenshot_url}
                      alt="Incident screenshot"
                      className="w-80 rounded-md transition-all duration-200 group-hover:blur-xs"
                    />
                  </div>
                </DialogTrigger>
                <DialogContent>
                  <img
                    src={incident.screenshot_url}
                    alt="Incident screenshot"
                    className="w-full rounded-md border shadow-xs"
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
