import { cn, getRegionFlags } from "@/frontend/lib/utils"
import { Route } from "@/frontend/routes/dashboard/$workspaceName/incidents/$id"
import { Link, useRouter } from "@tanstack/react-router"
import { useMutation } from "@tanstack/react-query"
import { formatDistanceToNowStrict, parseISO, format } from "date-fns"
import { ArrowLeft, Bold, Italic, List, LinkIcon } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/frontend/components/ui/button"
import { PostMortemEditor } from "../incidents/post-mortem-editor"
import type { Incident } from "@/frontend/lib/types"

export default function IncidentPage() {
  const { workspaceName, id } = Route.useParams()
  const incident = Route.useLoaderData() as Incident
  const router = useRouter()

  const acknowledgeMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/incidents/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
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
      const response = await fetch(`/api/incidents/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
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

  const postMortemMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/incidents/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_mortem: incident.post_mortem || "" }),
      })
      if (!response.ok) throw new Error("Failed to save post-mortem")
    },
    onSuccess: async () => {
      toast.success("Post-mortem saved")
      await router.invalidate()
    },
    onError: () => {
      toast.error("Failed to save post-mortem")
    },
  })

  const getIncidentStatus = (incident: Incident) => {
    if (incident.resolved_at) {
      return { status: "resolved", label: "Resolved", color: "bg-green-600" }
    }
    if (incident.acknowledged_at) {
      return { status: "acknowledged", label: "Acknowledged", color: "bg-yellow-600" }
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
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <Link
          to="/dashboard/$workspaceName/monitors/$id"
          params={{ workspaceName, id: incident.monitor_id }}
          search={{ days: 30 }}
          className="flex items-center justify-start text-xs gap-1 text-muted-foreground"
        >
          <ArrowLeft className="size-3" />
          <span className="hover:underline">Back to monitors</span>
        </Link>

        <div className="border border-dashed border-gray-400 p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-3">
              <div className={cn("w-3 h-3 mt-1", status.color)} />
              <div>
                <h1 className="text-xl font-bold tracking-tight text-gray-900 font-mono mb-2">
                  {status.label.toUpperCase()} INCIDENT
                </h1>
                <div className="space-y-1">
                  <p className="text-gray-600 text-sm font-mono">
                    STARTED {formatEventTime(incident.started_at).toUpperCase()}
                  </p>
                  <p className="text-gray-600 text-sm font-mono">DURATION {duration.toUpperCase()}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {status.status === "active" && (
                <Button
                  onClick={() => acknowledgeMutation.mutate()}
                  disabled={acknowledgeMutation.isPending}
                  size="sm"
                  className="bg-yellow-600 hover:bg-yellow-700 text-white font-mono tracking-wide text-xs px-4 py-2"
                >
                  {acknowledgeMutation.isPending ? "ACKNOWLEDGING..." : "ACKNOWLEDGE"}
                </Button>
              )}
              {status.status === "acknowledged" && (
                <Button
                  onClick={() => resolveMutation.mutate()}
                  disabled={resolveMutation.isPending}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white font-mono tracking-wide text-xs px-4 py-2"
                >
                  {resolveMutation.isPending ? "RESOLVING..." : "RESOLVE"}
                </Button>
              )}
            </div>
          </div>

          {incident.monitors?.error_message && (
            <div className="border border-dashed border-red-300 p-3 bg-red-50 mb-3">
              <p className="text-red-700 text-xs font-mono tracking-wide">
                ERROR: {incident.monitors.error_message.toUpperCase()}
              </p>
            </div>
          )}

          {incident.regions_affected && incident.regions_affected.length > 0 && (
            <div className="inline-block border border-dashed border-gray-300 px-2 py-1 bg-gray-50">
              <span className="text-gray-500 font-mono text-xs tracking-wide mr-2">REGIONS:</span>
              <span className="font-bold text-gray-900 text-xs">{getRegionFlags(incident.regions_affected)}</span>
            </div>
          )}
        </div>

        {/* Incident Explanation */}
        <div className="border border-dashed border-gray-400 p-4 bg-blue-50">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-blue-600 mt-2 flex-shrink-0" />
            <div className="space-y-2">
              <h3 className="font-bold text-gray-900 text-sm font-mono tracking-wide">WHAT IS AN INCIDENT?</h3>
              <p className="text-gray-700 text-xs leading-relaxed">
                An incident occurs when your monitor detects that your service is down, experiencing errors, or not responding as expected. 
                This page tracks the complete lifecycle of the incident from detection to resolution, including all actions taken by your team.
              </p>
            </div>
          </div>
        </div>

        <div className="border border-dashed border-gray-400 p-6 bg-white">
          <h2 className="text-sm font-bold mb-6 text-gray-900 font-mono tracking-wide">TIMELINE</h2>
          <div className="space-y-4">
            {timelineEvents.map((event) => (
              <div key={event.id} className="relative">
                <div className="flex gap-4">
                  <div className="flex-1 min-w-0 pb-4">
                    <div className="border border-dashed border-gray-300 p-4 bg-gray-50">
                      <div className="flex items-start gap-4 mb-2">
                        <span className="text-xs text-gray-500 font-mono tracking-wide whitespace-nowrap">
                          {formatEventTime(event.time).toUpperCase()}
                        </span>
                        <h3 className="font-bold text-gray-900 text-xs font-mono tracking-wide">
                          {event.title.toUpperCase()}
                        </h3>
                      </div>
                      <p className="text-gray-600 text-xs leading-relaxed ml-20">{event.description}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Post-mortem Explanation */}
        <div className="border border-dashed border-gray-400 p-4 bg-amber-50">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-amber-600 mt-2 flex-shrink-0" />
            <div className="space-y-2">
              <h3 className="font-bold text-gray-900 text-sm font-mono tracking-wide">WHAT IS A POST-MORTEM?</h3>
              <p className="text-gray-700 text-xs leading-relaxed">
                A post-mortem is a detailed analysis written for your team that explains what happened, why it happened, 
                what was done to resolve it, and how to prevent similar incidents in the future. This is an internal document 
                that helps your team learn from incidents and improve your systems.
              </p>
            </div>
          </div>
        </div>

        <div className="border border-dashed border-gray-400 p-6 bg-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-gray-900 font-mono tracking-wide">POST-MORTEM</h2>
            <Button
              onClick={() => postMortemMutation.mutate()}
              disabled={postMortemMutation.isPending}
              size="sm"
              className="bg-gray-900 hover:bg-gray-800 text-white font-mono tracking-wide text-xs px-4 py-2"
            >
              {postMortemMutation.isPending ? "SAVING..." : "SAVE POST-MORTEM"}
            </Button>
          </div>

          <div className="mb-4 flex items-center gap-2 border-b border-dashed border-gray-300 pb-2">
            <Button variant="outline" size="sm" className="p-1">
              <Bold className="h-3 w-3" />
            </Button>
            <Button variant="outline" size="sm" className="p-1">
              <Italic className="h-3 w-3" />
            </Button>
            <Button variant="outline" size="sm" className="p-1">
              <List className="h-3 w-3" />
            </Button>
            <Button variant="outline" size="sm" className="p-1">
              <LinkIcon className="h-3 w-3" />
            </Button>
          </div>

          <PostMortemEditor content={incident.post_mortem || ""} onChange={() => {}} />
        </div>
      </div>
    </div>
  )
}
