interface IncidentUpdate {
  id: string;
  author: string;
  author_name?: string;
  author_email?: string;
  content: string;
  created_at: string;
}

export function IncidentUpdatesSection({ updates }: { updates: IncidentUpdate[] }) {
  if (updates.length === 0) {
    return <div className="text-xs text-muted-foreground text-center">No updates yet.</div>;
  }

  return (
    <div className="space-y-4">
      {updates.map((update) => (
        <div key={update.id} className="border rounded-xs p-3 bg-background shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-mono text-muted-foreground">
              {new Date(update.created_at).toLocaleString()}
            </span>
            <div className="text-xs font-mono text-muted-foreground text-right">
              <div>{update.author_name || update.author}</div>
              {update.author_email && <div className="text-[10px] text-muted-foreground">{update.author_email}</div>}
            </div>
          </div>
          <div className="text-sm whitespace-pre-line" dangerouslySetInnerHTML={{ __html: update.content }} />
        </div>
      ))}
    </div>
  );
}

