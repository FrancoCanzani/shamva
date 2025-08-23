import { Alert, AlertDescription } from "@/frontend/components/ui/alert";
import { Download, FileText, Info, Terminal } from "lucide-react";

export default function CollectorSetupInstructions() {
  return (
    <div className="space-y-6">
      <h2 className="font-medium">Setup Instructions</h2>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          After creating the collector, download and run the collector agent on
          your server.
        </AlertDescription>
      </Alert>

      <div className="space-y-6">
        <div className="space-y-2">
          <h3 className="flex items-center gap-2 text-sm font-medium">
            <Download className="h-4 w-4" />
            1. Download & Install
          </h3>
          <div className="bg-muted rounded-md p-3 text-sm">
            <p className="mb-2">Download the collector for your platform:</p>
            <div className="space-y-1 text-xs">
              <p>
                <strong>Linux:</strong>{" "}
                <code className="bg-background rounded px-1">
                  wget
                  https://github.com/your-repo/releases/latest/download/shamva-collector-linux-amd64
                </code>
              </p>
              <p>
                <strong>macOS:</strong>{" "}
                <code className="bg-background rounded px-1">
                  curl -LO
                  https://github.com/your-repo/releases/latest/download/shamva-collector-darwin-amd64
                </code>
              </p>
              <p>
                <strong>Windows:</strong> Download from the releases page
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="flex items-center gap-2 text-sm font-medium">
            <Terminal className="h-4 w-4" />
            2. Run the Collector
          </h3>
          <div className="bg-muted rounded-md p-3 text-sm">
            <p className="mb-2">Make executable and run:</p>
            <div className="space-y-1 text-xs">
              <p>
                <code className="bg-background rounded px-1">
                  chmod +x shamva-collector
                </code>
              </p>
              <p>
                <code className="bg-background rounded px-1">
                  ./shamva-collector
                </code>
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="flex items-center gap-2 text-sm font-medium">
            <FileText className="h-4 w-4" />
            Need Help?
          </h3>
          <div className="bg-muted rounded-md p-3 text-sm">
            <p className="text-xs">
              For detailed configuration and advanced setup, see the{" "}
              <a
                href="/docs/collector"
                className="text-primary hover:underline"
              >
                collector documentation
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
