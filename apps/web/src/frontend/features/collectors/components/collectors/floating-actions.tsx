import { Button } from "@/frontend/components/ui/button";
import { Collector } from "@/frontend/lib/types";

interface FloatingActionsProps {
  selectedCollectors: Collector[];
  onSelectionChange: () => void;
}

export default function FloatingActions({
  selectedCollectors,
  onSelectionChange,
}: FloatingActionsProps) {
  if (selectedCollectors.length === 0) {
    return null;
  }

  const handleDeleteSelected = () => {
    if (confirm(`Are you sure you want to delete ${selectedCollectors.length} collector(s)?`)) {
      // TODO: Implement bulk delete
      console.log("Delete collectors:", selectedCollectors.map(c => c.id));
      onSelectionChange();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="flex items-center gap-2 rounded-lg bg-background border shadow-lg px-4 py-2">
        <span className="text-sm text-muted-foreground">
          {selectedCollectors.length} collector(s) selected
        </span>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleDeleteSelected}
        >
          Delete Selected
        </Button>
      </div>
    </div>
  );
}
