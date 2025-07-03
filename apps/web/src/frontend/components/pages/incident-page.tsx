import { getRegionFlags } from "@/frontend/lib/utils"
import { Route } from "@/frontend/routes/dashboard/$workspaceName/incidents/$id"
import { Link, useRouter } from "@tanstack/react-router"
import { useMutation } from "@tanstack/react-query"
import { formatDistanceToNowStrict, parseISO, format } from "date-fns"
import { ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/frontend/components/ui/button"
import type { Incident as IncidentBase } from "@/frontend/lib/types"
import { useAuth } from "@/frontend/lib/context/auth-context"
import { IncidentUpdateEditor } from "../incidents/incident-update-editor"
import { IncidentUpdatesSection } from "../incidents/incident-updates-section"
import { Separator } from "../ui/separator"

type Incident = IncidentBase & { updates?: any[] };

export default function IncidentPage() {
  const { workspaceName, id } = Route.useParams()
  const incident = Route.useLoaderData() as Incident
  const router = useRouter()
  const { session } = useAuth()

  const acknowledgeMutation = useMutation({
    mutationFn: async () => {
      if (!session?.access_token) {
        throw new Error("Authentication error. Please log in again.")
      }
      const response = await fetch(`/api/incidents/${id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ acknowledged_at: new Date().toISOString() }),
      })
      if (!response.ok) throw new Error("Failed to acknowledge incident")
    },
    onSuccess: async () => {
      toast.success("Incident acknowledged")
      await router.invalidate()
    },
    onError: () => toast.error("Failed to acknowledge incident"),
  })

  const resolveMutation = useMutation({
    mutationFn: async () => {
      if (!session?.access_token) {
        throw new Error("Authentication error. Please log in again.")
      }
      const response = await fetch(`/api/incidents/${id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ resolved_at: new Date().toISOString() }),
      })
      if (!response.ok) throw new Error("Failed to resolve incident")
    },
    onSuccess: async () => {
      toast.success("Incident resolved")
      await router.invalidate()
    },
    onError: () => toast.error("Failed to resolve incident"),
  })

  const updateMutation = useMutation({
    mutationFn: async ({ content }: { content: string }) => {
      if (!session?.access_token || !session?.user) throw new Error("Not authenticated");
      const res = await fetch(`/api/incidents/${id}/updates`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          content,
          author_name: session.user.user_metadata?.name || session.user.email || "",
          author_email: session.user.email || "",
        }),
      });
      if (!res.ok) throw new Error("Failed to post update");
      return res.json();
    },
    onSuccess: async () => {
      toast.success("Update posted");
      await router.invalidate();
    },
    onError: (error) => {
      toast.error("Failed to post update");
      console.error(error);
    },
  });

  const getIncidentStatus = (incident: Incident) => {
    if (incident.resolved_at) {
      return { status: "resolved", label: "Resolved", color: "bg-green-600" }
    }
    if (incident.acknowledged_at) {
      return {
        status: "acknowledged",
        label: "Acknowledged",
        color: "bg-yellow-600",
      }
    }
    return { status: "active", label: "Active", color: "bg-red-600" }
  }

  const getDuration = (startedAt: string) => {
    const start = parseISO(startedAt)
    return formatDistanceToNowStrict(start, { addSuffix: false })
  }

  const formatEventTime = (timeString: string) => {
    const time = parseISO(timeString)
    return format(time, "MMM d, HH:mm:ss")
  }

  const status = getIncidentStatus(incident)
  const duration = getDuration(incident.started_at)

  const timelineEvents = [
    {
      id: "started",
      title: "Incident Started",
      time: incident.started_at,
      description: "The incident was first detected",
    },
    ...(incident.notified_at
      ? [
          {
            id: "notified",
            title: "Notifications Sent",
            time: incident.notified_at,
            description: "Team members were notified",
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
          },
        ]
      : []),
  ]

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <Link
          to="/dashboard/$workspaceName/monitors/$id"
          params={{ workspaceName, id: incident.monitor_id }}
          search={{ days: 30 }}
          className="flex items-center justify-start text-xs gap-1 text-muted-foreground"
        >
          <ArrowLeft className="size-3" />
          <span className="hover:underline">Back to Monitor</span>
        </Link>

        <div className="border rounded-xs shadow-xs p-4">
          <div className="flex items-start justify-between mb-4">
            <div className="space-y-3">
              <h1 className="text-xl uppercase font-medium tracking-tight font-mono">
                {status.label.toUpperCase()} incident
              </h1>

              {incident.regions_affected && incident.regions_affected.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground uppercase tracking-wide">
                    Affected regions:
                  </span>
                  <div className="flex items-center gap-1">{getRegionFlags(incident.regions_affected)}</div>
                </div>
              )}

              <p className="text-xs font-mono text-muted-foreground">
                STARTED {formatEventTime(incident.started_at).toUpperCase()} ({duration.toUpperCase()})
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
                  {acknowledgeMutation.isPending ? "Acknowledging..." : "Acknowledge"}
                </Button>
              )}
              {status.status === "acknowledged" && (
                <Button
                  onClick={() => resolveMutation.mutate()}
                  disabled={resolveMutation.isPending}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white font-mono tracking-wide text-xs px-4 py-2"
                >
                  {resolveMutation.isPending ? "Resolving..." : "Resolve"}
                </Button>
              )}
            </div>
          </div>

          {incident.monitors?.error_message && (
            <div className="border rounded-xs shadow-xs border-red-300 dark:border-red-900 p-3 bg-red-50 dark:bg-background">
              <p className="text-red-900 text-xs font-mono tracking-wide">
                {incident.monitors.error_message.toUpperCase()}
              </p>
            </div>
          )}
        </div>
      

        <div className="border rounded-xs shadow-xs p-4">
          <h2 className="text-sm font-medium mb-4 font-mono">TIMELINE</h2>
          <div className="space-y-3">
            {timelineEvents.map((event) => (
              <div key={event.id} className="relative">
                <div className="flex gap-4">
                  <div className="flex-1 min-w-0 pb-2">
                    <div className="border rounded-xs shadow-xs p-2">
                      <div className="flex items-start gap-x-2 mb-2">
                        <span className="text-xs font-mono whitespace-nowrap">{formatEventTime(event.time)}</span>
                        <h3 className="font-medium text-xs font-mono">{event.title}</h3>
                      </div>
                      <p className="text-xs">{event.description}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border rounded-xs shadow-xs p-4">
          <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium font-mono">UPDATES</h2>
          </div>
          <IncidentUpdateEditor
            onSubmit={async (content) => {
              if (!session?.user) return;
              await updateMutation.mutateAsync({ content });
            }}
            authorName={session?.user?.user_metadata?.name || session?.user?.email || ""}
            authorEmail={session?.user?.email || ""}
            loading={updateMutation.isPending}
          />
          
          <Separator className="my-6"/>

          <IncidentUpdatesSection updates={incident.updates || []} />
        </div>
      </div>
    </div>
  )
}
