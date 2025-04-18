import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const [urlInput, setUrlInput] = useState("");
  const [slugInput, setSlugInput] = useState("");

  const handleSubmit = async () => {
    const response = await fetch("/api/shorten", {
      method: "POST",
      body: JSON.stringify({
        url: urlInput.trim(),
        slug: slugInput.trim(),
        expiresAt: null,
        user_id: "franco",
        is_active: true,
      }),
    });
    if (!response.ok) {
      return;
    }

    const result = await response.json();

    console.log(result);

    setUrlInput("");
    setSlugInput("");
  };

  return (
    <div className="p-2">
      <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
        <Input
          placeholder="URL"
          name="url"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
        />
        <Input
          placeholder="Slug"
          name="slug"
          value={slugInput}
          onChange={(e) => setSlugInput(e.target.value)}
        />
        <Button>Submit</Button>
        <span>{urlInput}</span>
        <span>{slugInput}</span>
      </form>
    </div>
  );
}
