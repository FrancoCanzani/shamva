interface IncidentUpdate {
  id: string;
  author: string;
  author_name?: string;
  author_email?: string;
  content: string;
  created_at: string;
  author_id?: string;
}

export function IncidentUpdatesSection({
  updates = [],
  onDelete,
  deletingId,
}: {
  updates: IncidentUpdate[];
  onDelete?: (id: string) => void;
  deletingId?: string;
}) {
  if (updates.length === 0) {
    return (
      <div className="text-sm text-muted-foreground text-center border border-dashed rounded-xs p-4">
        No updates yet
      </div>
    );
  }

  console.log(updates);

  return (
    <div className="space-y-4">
      {updates.map((update) => {
        return (
          <div
            key={update.id}
            className="border rounded-xs p-3 bg-background shadow-xs"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-mono text-muted-foreground">
                {new Date(update.created_at).toLocaleString()}
              </span>
              <div className="text-xs space-x-2 inline-flex font-mono text-muted-foreground text-right">
                <div>{update.author_name}</div>
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
              className="text-sm whitespace-pre-line"
              dangerouslySetInnerHTML={{ __html: update.content }}
            />
          </div>
        );
      })}
    </div>
  );
}
