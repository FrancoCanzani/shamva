import HeartbeatForm from "@/frontend/components/heartbeat/heartbeat-form";
import { useWorkspaces } from "@/frontend/lib/context/workspace-context";
import { supabase } from "@/frontend/lib/supabase";
import type { ApiResponse, Heartbeat } from "@/frontend/lib/types";
import { Route as NewHeartbeatRoute } from "@/frontend/routes/dashboard/$workspaceName/heartbeats/new";
import { useMutation } from "@tanstack/react-query";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { AlertCircleIcon, Check, Copy } from "lucide-react";
import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import CodeSamples from "../code-samples";
import { Alert, AlertDescription } from "../ui/alert";
import { Button } from "../ui/button";

export default function NewHeartbeatPage() {
  const [copied, setCopied] = useState(false);
  const [uuid] = useState(() => uuidv4());

  const navigate = useNavigate();
  const { currentWorkspace: workspace } = useWorkspaces();
  const router = useRouter();
  const params = NewHeartbeatRoute.useParams();

  const apiEndpoint = `https://api.yourapp.com/api/heartbeat?id=${uuid}`;

  const createHeartbeat = useMutation({
    mutationFn: async (data: {
      name: string;
      expectedLapseMs: number;
      gracePeriodMs: number;
      workspaceId: string;
      pingId: string;
    }): Promise<Heartbeat> => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(`/api/heartbeats`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData.error || "Failed to create heartbeat");
      }

      const result: ApiResponse<Heartbeat> = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to create heartbeat");
      }

      return result.data;
    },
    onSuccess: async () => {
      await router.invalidate();
      navigate({ to: `/dashboard/${params.workspaceName}/heartbeats` });
    },
  });

  const handleSubmit = async (data: {
    name: string;
    expectedLapseMs: number;
    gracePeriodMs: number;
    workspaceId: string;
    pingId: string;
  }) => {
    try {
      await createHeartbeat.mutateAsync(data);
    } catch (error) {
      console.error("Failed to create heartbeat:", error);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(apiEndpoint);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleCancel = () => {
    navigate({ to: `/dashboard/${params.workspaceName}/heartbeats` });
  };

  if (!workspace) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Loading workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl p-4 pb-8">
      <div className="space-y-8">
        <div>
          <h1 className="text-xl font-medium">Create Heartbeat</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Let us know your service is ok.
          </p>
        </div>
        <div>
          <HeartbeatForm
            workspaceId={workspace.id}
            pingId={uuid}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />

          <div className="space-y-4">
            <div className="space-y-3">
              <h3 className="text-sm font-medium">API Endpoint</h3>
              <Alert className="rounded-xs border-dashed">
                <AlertCircleIcon className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  This endpoint will only be valid after saving. Monitoring
                  starts when first pinged for sync.
                </AlertDescription>
              </Alert>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-medium">Ping URL</h3>
              <div className="flex gap-2">
                <div className="flex-1 rounded-xs border px-3 py-2 shadow-xs">
                  <code className="text-xs break-all">{apiEndpoint}</code>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={copyToClipboard}
                >
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Integration Examples</h3>
              <CodeSamples
                samples={[
                  {
                    language: "bash",
                    label: "cURL",
                    code: `# Simple ping
      curl "${apiEndpoint}"

      # With timeout and retry
      curl "${apiEndpoint}" \\
        --max-time 10 \\
        --retry 3 \\
        --retry-delay 2`,
                  },
                  {
                    language: "python",
                    label: "Python",
                    code: `import requests
      import sys
      from datetime import datetime

      def send_heartbeat():
          try:
              response = requests.get(
                  "${apiEndpoint}",
                  timeout=10
              )
              response.raise_for_status()
              print(f"[{datetime.now()}] Heartbeat sent successfully")
              return True
          except requests.exceptions.RequestException as e:
              print(f"[{datetime.now()}] Failed to send heartbeat: {e}")
              return False

      # Usage
      if __name__ == "__main__":
          success = send_heartbeat()
          sys.exit(0 if success else 1)`,
                  },
                  {
                    language: "javascript",
                    label: "Node.js",
                    code: `const https = require('https');

      async function sendHeartbeat() {
        try {
          const response = await fetch("${apiEndpoint}", {
            method: 'GET',
            timeout: 10000,
            headers: {
              'User-Agent': 'MyApp/1.0'
            }
          });

          if (!response.ok) {
            throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
          }

          console.log(\`[\${new Date().toISOString()}] Heartbeat sent successfully\`);
          return true;
        } catch (error) {
          console.error(\`[\${new Date().toISOString()}] Failed to send heartbeat:\`, error.message);
          return false;
        }
      }

      // Usage
      sendHeartbeat()
        .then(success => process.exit(success ? 0 : 1))
        .catch(err => {
          console.error('Unexpected error:', err);
          process.exit(1);
        });`,
                  },
                ]}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
