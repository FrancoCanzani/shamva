import { Badge } from "@/frontend/components/ui/badge";
import { Button } from "@/frontend/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/frontend/components/ui/card";
import { Brain, Zap } from "lucide-react";
import { useAiCheck } from "../api/ai-check";
import { IncidentWithUpdates } from "../types";

interface AiIncidentAnalysisProps {
  incident: IncidentWithUpdates;
  minimal?: boolean;
}

export default function AiIncidentAnalysis({
  incident,
  minimal = false,
}: AiIncidentAnalysisProps) {
  const aiCheckMutation = useAiCheck();

  const handleAnalyze = async () => {
    try {
      await aiCheckMutation.mutateAsync();
    } catch (error) {
      console.error("AI analysis failed:", error);
    }
  };

  const analysis = incident.ai_analysis;
  const hasAnalysis =
    analysis &&
    typeof analysis.rootCause === "string" &&
    Array.isArray(analysis.solutions) &&
    Array.isArray(analysis.prevention) &&
    typeof analysis.confidence === "number" &&
    typeof analysis.summary === "string";

  if (minimal) {
    if (!hasAnalysis) {
      return (
        <div className="rounded border p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium">
            <Brain className="h-4 w-4" /> AI Analysis
          </div>
          <div className="space-y-4">
            <p className="text-muted-foreground text-sm">
              Get AI-powered insights about this incident
            </p>
            <Button
              onClick={handleAnalyze}
              disabled={aiCheckMutation.isPending}
              size="xs"
              className="w-full"
            >
              {aiCheckMutation.isPending ? (
                <>
                  <Zap className="mr-2 h-4 w-4 animate-pulse" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Brain className="mr-2 h-4 w-4" />
                  Analyze with AI
                </>
              )}
            </Button>
          </div>
        </div>
      );
    }

    const { rootCause, solutions, prevention, confidence } =
      incident.ai_analysis!;

    return (
      <div className="rounded border p-4">
        <div className="mb-3 flex items-center justify-between text-sm font-medium">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4" /> AI Analysis
          </div>
          <Badge>{confidence}/10 confidence</Badge>
        </div>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <h4 className="text-xs font-medium uppercase tracking-wide">
              Root Cause
            </h4>
            <p className="text-muted-foreground text-sm">{rootCause}</p>
          </div>

          <div className="space-y-1.5">
            <h4 className="text-xs font-medium uppercase tracking-wide">
              Solutions
            </h4>
            <ul className="list-disc space-y-1 pl-4 text-sm text-muted-foreground">
              {solutions.map((s, idx) => (
                <li key={idx}>{s}</li>
              ))}
            </ul>
          </div>

          <div className="space-y-1.5">
            <h4 className="text-xs font-medium uppercase tracking-wide">
              Prevention
            </h4>
            <ul className="list-disc space-y-1 pl-4 text-sm text-muted-foreground">
              {prevention.map((p, idx) => (
                <li key={idx}>{p}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // Default (card) rendering retained for other pages/contexts
  if (!hasAnalysis) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Brain className="h-4 w-4" />
            AI Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-center">
            <p className="text-muted-foreground text-sm">
              Get AI-powered insights about this incident
            </p>
            <Button
              onClick={handleAnalyze}
              disabled={aiCheckMutation.isPending}
              size="sm"
              className="w-full"
            >
              {aiCheckMutation.isPending ? (
                <>
                  <Zap className="mr-2 h-4 w-4 animate-pulse" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Brain className="mr-2 h-4 w-4" />
                  Analyze with AI
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { rootCause, solutions, prevention, confidence } = incident.ai_analysis!;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            AI Analysis
          </div>
          <Badge>{confidence}/10 confidence</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <h4 className="text-xs font-medium uppercase tracking-wide">
            Root Cause
          </h4>
          <p className="text-muted-foreground text-sm">{rootCause}</p>
        </div>

        <div className="space-y-2">
          <h4 className="text-xs font-medium uppercase tracking-wide">
            Solutions
          </h4>
          <ul className="list-disc space-y-1 pl-4 text-sm text-muted-foreground">
            {solutions.map((s, idx) => (
              <li key={idx}>{s}</li>
            ))}
          </ul>
        </div>

        <div className="space-y-2">
          <h4 className="text-xs font-medium uppercase tracking-wide">
            Prevention
          </h4>
          <ul className="list-disc space-y-1 pl-4 text-sm text-muted-foreground">
            {prevention.map((p, idx) => (
              <li key={idx}>{p}</li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
