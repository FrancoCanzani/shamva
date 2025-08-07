import { Button } from "@/frontend/components/ui/button";
import { Separator } from "@/frontend/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/frontend/components/ui/tabs";
import { Dialog, DialogContent, DialogTrigger } from "@/frontend/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/frontend/components/ui/tooltip";
import { Route } from "@/frontend/routes/dashboard/$workspaceName/incidents/$id";
import { getRegionNameFromCode } from "@/frontend/utils/utils";
import { Link, useRouteContext, useRouter } from "@tanstack/react-router";
import { format, formatDistanceToNowStrict, parseISO } from "date-fns";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import {
  useAcknowledgeIncident,
  useCreateIncidentUpdate,
  useDeleteIncidentUpdate,
  useResolveIncident,
  useUpdateIncident,
} from "../api/mutations";
import { IncidentWithUpdates } from "../types";
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
  const [isEditingPostMortem, setIsEditingPostMortem] = useState(false);
  const [newUpdateDraft, setNewUpdateDraft] = useState<string>("");

  const acknowledgeMutation = useAcknowledgeIncident();
  const resolveMutation = useResolveIncident();
  const updateMutation = useCreateIncidentUpdate();
  const deleteUpdateMutation = useDeleteIncidentUpdate();
  const updateIncidentMutation = useUpdateIncident();

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


  return (
    <div className="flex h-full flex-col">
      <div className="mx-auto w-full max-w-5xl flex-1 space-y-8 p-6">
        <Link
          to="/dashboard/$workspaceName/monitors/$id"
          params={{ workspaceName, id: incident.monitor_id }}
          search={{ days: 7 }}
          className="text-muted-foreground mb-6 flex items-center gap-1 text-xs hover:underline"
        >
          <ArrowLeft className="size-3" />
          Back to Monitor
        </Link>

        <div className="space-y-6">
          {/* Header (no card/border) */}
          <div className="">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-medium ${status.color}`}>
                    {status.label.toUpperCase()}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    Started {startedDate}, <span className="font-mono">{startedTime}</span> (<span className="font-mono">{duration}</span>)
                  </span>
                </div>
                
                {incident.regions_affected && incident.regions_affected.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-muted-foreground">Affected regions:</span>
                    <span>
                      {incident.regions_affected
                        .map((code) => getRegionNameFromCode(code))
                        .join(", ")}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                {incident.screenshot_url && (
                  <Dialog>
                    <Tooltip>
                      <TooltipTrigger className="text-xs hover:underline">
                        Screenshot
                      </TooltipTrigger>
                      <TooltipContent>View screenshot</TooltipContent>
                    </Tooltip>
                    <DialogTrigger className="sr-only">Open Screenshot</DialogTrigger>
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
                    {acknowledgeMutation.isPending ? "Acknowledging..." : "Acknowledge"}
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
          </div>

          {(incident.error_message || incident.monitors?.error_message) && (
            <div className="rounded border border-red-200 bg-red-50 p-3">
              <p className="text-xs text-red-900">
                {(incident.error_message || incident.monitors?.error_message)?.toUpperCase()}
              </p>
            </div>
          )}

          <div className="rounded border">
            <Tabs defaultValue="updates" className="w-full">
              <div className="border-b px-4 pt-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="updates">Updates</TabsTrigger>
                  <TabsTrigger value="post-mortem">Post-mortem</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="updates" className="p-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium">New update</label>
                    <textarea
                      value={newUpdateDraft}
                      onChange={(e) => setNewUpdateDraft(e.target.value)}
                      placeholder="Write an update..."
                      className="min-h-32 w-full rounded border p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <div className="flex items-center justify-end">
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={async () => {
                          if (!auth.session?.user) return;
                          const content = newUpdateDraft.trim();
                          if (!content) return;
                          await updateMutation.mutateAsync({
                            incidentId: id,
                            content,
                          });
                          setNewUpdateDraft("");
                          await router.invalidate();
                        }}
                        disabled={updateMutation.isPending || !newUpdateDraft.trim()}
                      >
                        {updateMutation.isPending ? "Posting..." : "Post"}
                      </Button>
                    </div>
                  </div>

                  <Separator />

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
              </TabsContent>

              <TabsContent value="post-mortem" className="p-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Post-mortem</span>
                    {!isEditingPostMortem ? (
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => setIsEditingPostMortem(true)}
                      >
                        Edit
                      </Button>
                    ) : null}
                  </div>

                  {!isEditingPostMortem ? (
                    incident.post_mortem && incident.post_mortem.trim().length > 0 ? (
                      <div className="prose prose-sm max-w-none">
                        <pre className="whitespace-pre-wrap text-sm leading-6">{incident.post_mortem}</pre>
                      </div>
                    ) : (
                      <div className="rounded border border-dashed p-6 text-center text-sm text-muted-foreground">
                        No post-mortem written yet. Document what happened, why it happened, and how to prevent it in the future.
                      </div>
                    )
                  ) : (
                    <div className="space-y-3">
                      <IncidentUpdateEditor
                        onSubmit={async (content) => {
                          await updateIncidentMutation.mutateAsync({
                            incidentId: id,
                            data: { post_mortem: content },
                          });
                          setIsEditingPostMortem(false);
                        }}
                        loading={updateIncidentMutation.isPending}
                      />
                      <div className="flex items-center gap-2">
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => {
                            setIsEditingPostMortem(false);
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
