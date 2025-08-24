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
    if (
      confirm(
        `Are you sure you want to delete ${selectedCollectors.length} collector(s)?`
      )
    ) {
      // TODO: Implement bulk delete
      console.log(
        "Delete collectors:",
        selectedCollectors.map((c) => c.id)
      );
      onSelectionChange();
    }
  };

  return (
    <div className="fixed right-6 bottom-6 z-50">
      <div className="bg-background flex items-center gap-2 rounded-lg border px-4 py-2 shadow-lg">
        <span className="text-muted-foreground text-sm">
          {selectedCollectors.length} collector(s) selected
        </span>
        <Button variant="destructive" size="sm" onClick={handleDeleteSelected}>
          Delete Selected
        </Button>
      </div>
    </div>
  );
}
