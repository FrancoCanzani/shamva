import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { cn } from "../lib/utils";
import { Button } from "./ui/button";

interface CodeSample {
  language: string;
  code: string;
  label?: string;
}

interface TabbedCodeDisplayProps {
  samples: CodeSample[];
  className?: string;
}

export default function CodeSamples({
  samples,
  className,
}: TabbedCodeDisplayProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(currentSample.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  if (!samples || samples.length === 0) {
    return null;
  }

  const currentSample = samples[activeTab];

  return (
    <div className={cn("rounded-xs border shadow-xs", className)}>
      <div className="border-border flex border-b">
        {samples.map((sample, index) => (
          <button
            key={index}
            onClick={() => setActiveTab(index)}
            className={cn(
              "px-4 py-2 text-sm font-medium transition-colors",
              "border-b border-transparent",
              "hover:text-foreground hover:border-border",
              activeTab === index
                ? "text-foreground border-foreground bg-muted/50"
                : "text-muted-foreground"
            )}
          >
            {sample.label || sample.language}
          </button>
        ))}
      </div>
      <div className="p-2 pb-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-muted-foreground font-mono text-xs">
            {currentSample.language}
          </span>
          <Button
            onClick={copyToClipboard}
            variant={"outline"}
            size={"xs"}
            className="text-muted-foreground"
          >
            {copied ? <Check /> : <Copy />}
          </Button>
        </div>
        <pre className="bg-carbon-50/10 overflow-hidden rounded-xs p-2 font-mono text-xs">
          {currentSample.code}
        </pre>
      </div>
    </div>
  );
}
