import { IncidentUpdateWithAuthor } from "../types";

export function IncidentUpdatesSection({
  updates = [],
  onDelete,
  deletingId,
}: {
  updates: IncidentUpdateWithAuthor[];
  onDelete?: (id: string) => void;
  deletingId?: string;
}) {
  if (updates.length === 0) {
    return (
      <div className="text-muted-foreground rounded border border-dashed p-4 text-center text-sm">
        No updates yet
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {updates.map((update) => {
        return (
          <div
            key={update.id}
            className="bg-background rounded border p-3 shadow-xs"
          >
            <div className="mb-1 flex items-center justify-between">
              <span className="text-muted-foreground text-xs">
                {new Date(update.created_at).toLocaleString()}
              </span>
              <div className="text-muted-foreground inline-flex space-x-2 text-right text-xs">
                <div>By {update.author_name}</div>
                {update.author_email && (
                  <div className="text-muted-foreground hidden md:block">
                    ({update.author_email})
                  </div>
                )}
                <button
                  className="text-black hover:underline"
                  onClick={() => onDelete && onDelete(update.id)}
                  disabled={deletingId === update.id}
                >
                  {deletingId === update.id ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
            <div
              className="prose prose-sm text-sm whitespace-pre-line"
              dangerouslySetInnerHTML={{ __html: update.content }}
            />
          </div>
        );
      })}
    </div>
  );
}
