import { cn, getRegionFlags } from "@/frontend/lib/utils";
import { Route } from "@/frontend/routes/dashboard/$workspaceName/incidents/$id";
import { Link, useRouter } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { formatDistanceToNowStrict, parseISO } from "date-fns";
import { ArrowLeft, CheckCircle, Clock, ExternalLink, FileText, Save } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/frontend/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/frontend/components/ui/card";
import { Textarea } from "@/frontend/components/ui/textarea";
import { Badge } from "@/frontend/components/ui/badge";
import { Incident } from "@/frontend/lib/types";

export default function IncidentPage() {
  const { workspaceName, id } = Route.useParams();
  const incident = Route.useLoaderData() as Incident;
  const [postMortem, setPostMortem] = useState(incident.post_mortem || "");
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const acknowledgeMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/incidents/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
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
      const response = await fetch(`/api/incidents/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
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

  const postMortemMutation = useMutation({
    mutationFn: async () => {
      setSaving(true);
      const response = await fetch(`/api/incidents/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_mortem: postMortem }),
      });
      if (!response.ok) throw new Error("Failed to save post-mortem");
    },
    onSuccess: async () => {
      toast.success("Post-mortem saved");
      setSaving(false);
      await router.invalidate();
    },
    onError: () => {
      toast.error("Failed to save post-mortem");
      setSaving(false);
    },
  });

  const getIncidentStatus = (incident: Incident) => {
    if (incident.resolved_at) {
      return { status: "resolved", label: "Resolved", color: "bg-emerald-500" };
    }
    if (incident.acknowledged_at) {
      return { status: "acknowledged", label: "Acknowledged", color: "bg-amber-500" };
    }
    return { status: "active", label: "Active", color: "bg-red-500" };
  };

  const getDuration = (startedAt: string) => {
    const start = parseISO(startedAt);
    return formatDistanceToNowStrict(start, { addSuffix: false });
  };

  const status = getIncidentStatus(incident);
  const duration = getDuration(incident.started_at);

  const timelineEvents = [
    {
      id: "started",
      title: "Incident Started",
      time: incident.started_at,
      description: "The incident was first detected",
      icon: "🔴",
      color: "border-red-500",
    },
    ...(incident.notified_at ? [{
      id: "notified",
      title: "Notifications Sent",
      time: incident.notified_at,
      description: "Team members were notified",
      icon: "📧",
      color: "border-blue-500",
    }] : []),
    ...(incident.acknowledged_at ? [{
      id: "acknowledged",
      title: "Incident Acknowledged",
      time: incident.acknowledged_at,
      description: "The incident was acknowledged by the team",
      icon: "👁️",
      color: "border-amber-500",
    }] : []),
    ...(incident.resolved_at ? [{
      id: "resolved",
      title: "Incident Resolved",
      time: incident.resolved_at,
      description: "The incident was resolved",
      icon: "✅",
      color: "border-emerald-500",
    }] : []),
  ];

  return (
    <div className="flex flex-1 w-full mx-auto p-4 flex-col max-w-4xl">
      <div className="flex items-center justify-between gap-6 mb-6">
        <Link
          to="/dashboard/$workspaceName/monitors/$id"
          params={{ workspaceName, id: incident.monitor_id }}
          search={{ days: 30 }}
          className="flex items-center justify-start text-xs gap-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-3" />
          <span>Back to monitor</span>
        </Link>
      </div>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className={cn("w-3 h-3 rounded-full", status.color)} />
              <h1 className="text-2xl font-semibold">{status.label} Incident</h1>
              <Badge variant="secondary">{duration}</Badge>
            </div>
            <p className="text-muted-foreground">
              Started {formatDistanceToNowStrict(parseISO(incident.started_at), { addSuffix: true })}
            </p>
          </div>
          <div className="flex gap-2">
            {status.status === "active" && (
              <Button onClick={() => acknowledgeMutation.mutate()} variant="outline" disabled={acknowledgeMutation.isPending}>
                <Clock className="h-4 w-4 mr-2" />
                {acknowledgeMutation.isPending ? "Acknowledging..." : "Acknowledge"}
              </Button>
            )}
            {status.status === "acknowledged" && (
              <Button onClick={() => resolveMutation.mutate()} variant="outline" disabled={resolveMutation.isPending}>
                <CheckCircle className="h-4 w-4 mr-2" />
                {resolveMutation.isPending ? "Resolving..." : "Resolve"}
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Timeline */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {timelineEvents.map((event, index) => (
                    <div key={event.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={cn("w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm", event.color)}>
                          {event.icon}
                        </div>
                        {index < timelineEvents.length - 1 && (
                          <div className="w-0.5 h-8 bg-border mt-2"></div>
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <h3 className="font-medium">{event.title}</h3>
                        <p className="text-sm text-muted-foreground mb-1">{event.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNowStrict(parseISO(event.time), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Details */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {incident.regions_affected && incident.regions_affected.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Regions affected</p>
                    <p className="text-sm">{getRegionFlags(incident.regions_affected)}</p>
                  </div>
                )}
                
                {incident.downtime_duration_ms && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total downtime</p>
                    <p className="text-sm">{Math.round(incident.downtime_duration_ms / 1000 / 60)} minutes</p>
                  </div>
                )}

                {incident.screenshot_url && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Screenshot</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(incident.screenshot_url!, "_blank")}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Screenshot
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Post-mortem */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Post-mortem
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  placeholder="Add post-mortem analysis, root cause, and resolution steps..."
                  value={postMortem}
                  onChange={(e) => setPostMortem(e.target.value)}
                  className="min-h-[200px] resize-none"
                />
                <Button 
                  onClick={() => postMortemMutation.mutate()} 
                  disabled={saving || postMortemMutation.isPending}
                  className="w-full"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {postMortemMutation.isPending ? "Saving..." : "Save Post-mortem"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 