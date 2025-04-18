import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { cn } from "../lib/utils";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const [urlInput, setUrlInput] = useState("");
  const [slugInput, setSlugInput] = useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const response = await fetch("/api/shorten", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: urlInput.trim(),
        slug: slugInput.trim() || undefined,
      }),
    });
    if (!response.ok) {
      console.error("Form submission failed", await response.json());
      return;
    }
    const result = await response.json();
    console.log(result);
    setUrlInput("");
    setSlugInput("");
  };

  return (
    <div className="max-w-md mx-auto gap-6 flex flex-col py-8 px-4">
      <div className="text-center space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Blinks</h1>
        <p className="text-muted-foreground text-lg">
          Create short, memorable links.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
        <div className="gap-1.5 flex-col flex">
          <Label htmlFor="url">URL to shorten *</Label>
          <Input
            id="url"
            placeholder="https://your-long-url.com/with/path"
            name="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            required
            type="url"
          />
        </div>

        <div className="gap-1.5 flex-col flex">
          <Label htmlFor="slug">Custom Slug (Optional)</Label>
          <div
            className={cn(
              "flex h-9 w-full items-center rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30",
              "focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]",
            )}
          >
            <span className="text-muted-foreground select-none shrink-0">
              blinks.sh/
            </span>
            <input
              id="slug"
              placeholder="your-custom-slug"
              name="slug"
              value={slugInput}
              onChange={(e) => setSlugInput(e.target.value)}
              className="w-full bg-transparent p-0 outline-none focus:ring-0 border-none h-full flex-1 min-w-0"
            />
          </div>
        </div>

        <Button type="submit" className="mt-2">
          Create Link
        </Button>
      </form>
    </div>
  );
}
