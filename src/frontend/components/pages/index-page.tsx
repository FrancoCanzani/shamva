import { useAuth } from "@/frontend/lib/context/auth-context";
import { supabase } from "@/frontend/lib/supabase";
import { cn } from "@/frontend/lib/utils";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useDebounceCallback } from "usehooks-ts";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

interface SlugExistsResponse {
  exists: boolean;
}

export default function IndexPage() {
  const [urlInput, setUrlInput] = useState("");
  const [slugInput, setSlugInput] = useState("");
  const [slugExists, setSlugExists] = useState(false);
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);

  const { user, isLoading, signOut } = useAuth();

  const name =
    user &&
    user.identities &&
    user.identities[0] &&
    user.identities[0].identity_data &&
    user.identities[0].identity_data.full_name;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const { data } = await supabase.auth.getSession();

    const response = await fetch("/shorten", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${data?.session?.access_token}`,
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

  const handleCheckSlugAvailability = async (value: string) => {
    setIsCheckingSlug(true);
    try {
      const res = await fetch(`/slug/exists?slug=${encodeURIComponent(value)}`);

      if (!res.ok) {
        return;
      }

      const data = (await res.json()) as SlugExistsResponse;

      const exists = data.exists;

      setSlugExists(exists);
      console.log(exists);
    } catch {
      toast.error("There was an error checking slug availability");
    } finally {
      setIsCheckingSlug(false);
    }
  };

  const debouncedSlugCheck = useDebounceCallback(
    handleCheckSlugAvailability,
    700,
  );

  return (
    <div className="w-full mx-auto gap-6 flex flex-col p-4">
      <header className="w-full flex items-center justify-between space-x-2">
        {!isLoading && user ? name : <Link to="/auth/login">Login</Link>}
        <Link to="/dashboard/links">Dashboard</Link>
        <Button variant={"outline"} size={"sm"} onClick={signOut}>
          Sign Out
        </Button>
      </header>
      <div className="w-full max-w-xl mx-auto gap-6 flex flex-col py-8 px-4">
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
            <div className="flex items-center justify-between">
              <Label htmlFor="slug">Custom Slug (Optional)</Label>
              {slugExists && !isCheckingSlug && (
                <span className="text-xs text-red-500">{`${slugInput} is already in use`}</span>
              )}
            </div>
            <div
              className={cn(
                "flex h-9 w-full items-center rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30",
                "focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]",
                {
                  "focus-within::border-red-500 focus-within:ring-red-500/50 focus-within:border-red-500":
                    slugExists,
                },
              )}
            >
              <span className="text-muted-foreground select-none shrink-0">
                blinks.sh/
              </span>
              <input
                min={3}
                id="slug"
                placeholder="your-custom-slug"
                name="slug"
                value={slugInput}
                onChange={(e) => {
                  setSlugInput(e.target.value);
                  if (e.target.value && e.target.value.length >= 3) {
                    debouncedSlugCheck(e.target.value);
                  } else {
                    setSlugExists(false);
                  }
                }}
                className="w-full bg-transparent p-0 outline-none focus:ring-0 border-none h-full flex-1 min-w-0"
              />
            </div>
          </div>

          <Button type="submit" className="mt-2">
            Create Link
          </Button>
        </form>
      </div>
    </div>
  );
}
