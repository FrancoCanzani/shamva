import { Check, Copy } from "lucide-react";
import { useState } from "react";
import SyntaxHighlighter from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

interface CodeSample {
  language: string;
  label: string;
  code: string;
}

interface CodeSamplesProps {
  samples: CodeSample[];
  title?: string;
}

const getLanguageForHighlighter = (language: string): string => {
  const languageMap: { [key: string]: string } = {
    javascript: "javascript",
    typescript: "typescript",
    python: "python",
    curl: "bash",
    bash: "bash",
    json: "json",
    html: "html",
    css: "css",
    sql: "sql",
    java: "java",
    csharp: "csharp",
    php: "php",
    ruby: "ruby",
    go: "go",
    rust: "rust",
    swift: "swift",
    kotlin: "kotlin",
  };
  return languageMap[language] || "text";
};

export default function CodeSamples({ samples, title }: CodeSamplesProps) {
  const [copiedStates, setCopiedStates] = useState<{ [key: string]: boolean }>(
    {}
  );

  const copyToClipboard = async (code: string, language: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedStates((prev) => ({ ...prev, [language]: true }));
      setTimeout(() => {
        setCopiedStates((prev) => ({ ...prev, [language]: false }));
      }, 2000);
    } catch (err) {
      console.error("Failed to copy code:", err);
    }
  };

  if (!samples || samples.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-4xl">
      {title && <h3 className="mb-4 text-lg font-semibold">{title}</h3>}
      <Card>
        <CardContent className="p-0">
          <Tabs defaultValue={samples[0].language} className="w-full">
            <div className="bg-muted/50 flex items-center justify-between border-b px-4 py-2">
              <TabsList className="h-9">
                {samples.map((sample) => (
                  <TabsTrigger
                    key={sample.language}
                    value={sample.language}
                    className="text-sm"
                  >
                    {sample.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            {samples.map((sample) => (
              <TabsContent
                key={sample.language}
                value={sample.language}
                className="relative m-0"
              >
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hover:bg-muted absolute top-2 right-2 h-8 w-8 p-0"
                    onClick={() =>
                      copyToClipboard(sample.code, sample.language)
                    }
                  >
                    {copiedStates[sample.language] ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                    <span className="sr-only">
                      {copiedStates[sample.language] ? "Copied" : "Copy code"}
                    </span>
                  </Button>
                  <SyntaxHighlighter
                    language={getLanguageForHighlighter(sample.language)}
                    style={oneDark}
                    customStyle={{
                      margin: 0,
                      borderRadius: 0,
                      background: "hsl(var(--muted))",
                      fontSize: "0.875rem",
                      lineHeight: "1.25rem",
                    }}
                    codeTagProps={{
                      style: {
                        color: "hsl(var(--foreground))",
                        fontFamily:
                          'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
                      },
                    }}
                  >
                    {sample.code}
                  </SyntaxHighlighter>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
