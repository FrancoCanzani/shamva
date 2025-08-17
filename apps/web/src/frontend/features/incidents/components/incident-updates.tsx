import NotFoundMessage from "@/frontend/components/not-found-message";
import { Button } from "@/frontend/components/ui/button";
import { Textarea } from "@/frontend/components/ui/textarea";
import { useRouter } from "@tanstack/react-router";
import { useState } from "react";
import {
  useCreateIncidentUpdate,
  useDeleteIncidentUpdate,
} from "../api/mutations";
import { IncidentUpdateWithAuthor } from "../types";

interface IncidentUpdatesProps {
  incidentId: string;
  updates: IncidentUpdateWithAuthor[];
}

export default function IncidentUpdates({
  incidentId,
  updates,
}: IncidentUpdatesProps) {
  const [showComposer, setShowComposer] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<string>("");
  const createMutation = useCreateIncidentUpdate();
  const deleteMutation = useDeleteIncidentUpdate();
  const router = useRouter();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Updates</span>
        {showComposer ? (
          <Button
            variant="outline"
            size="xs"
            onClick={() => setShowComposer(false)}
          >
            Cancel
          </Button>
        ) : (
          <Button
            variant="outline"
            size="xs"
            onClick={() => setShowComposer(true)}
          >
            New Update
          </Button>
        )}
      </div>

      {showComposer && (
        <div className="space-y-2">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Write an update..."
            className="text-xs placeholder:text-xs"
            rows={8}
          />
          <div className="flex items-center justify-end">
            <Button
              size="xs"
              variant="outline"
              disabled={createMutation.isPending || !draft.trim()}
              onClick={async () => {
                const content = draft.trim();
                if (!content) return;
                await createMutation.mutateAsync({ incidentId, content });
                setDraft("");
                setShowComposer(false);
                await router.invalidate();
              }}
            >
              {createMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {updates.length === 0 ? (
          <NotFoundMessage message="No updates" />
        ) : (
          updates.map((update) => (
            <div
              key={update.id}
              className="rounded border bg-stone-50 p-2 dark:bg-stone-950"
            >
              <div className="mb-1 flex items-center justify-between">
                <span className="text-muted-foreground text-xs">
                  {new Date(update.created_at).toLocaleString()}
                </span>
                <div className="text-muted-foreground inline-flex space-x-2 text-right text-xs">
                  <div>{update.author_name}</div>
                  <button
                    className="text-black hover:underline dark:text-white"
                    onClick={async () => {
                      setDeletingId(update.id);
                      try {
                        await deleteMutation.mutateAsync({
                          incidentId,
                          updateId: update.id,
                        });
                      } finally {
                        setDeletingId(null);
                      }
                    }}
                    disabled={deletingId === update.id}
                  >
                    {deletingId === update.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
              <div
                className="prose prose-sm dark:prose-invert text-sm whitespace-pre-line"
                dangerouslySetInnerHTML={{ __html: update.content }}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
