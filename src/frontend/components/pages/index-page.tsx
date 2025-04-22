import { useAuth } from "@/frontend/lib/context/auth-context";
import { supabase } from "@/frontend/lib/supabase";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

export default function IndexPage() {
  const [urlInput, setUrlInput] = useState("");

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

    const response = await fetch(
      `/api/check?url=${encodeURIComponent(urlInput.trim())}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${data?.session?.access_token}`,
        },
      },
    );
    if (!response.ok) {
      console.error("Form submission failed", await response.json());
      return;
    }
    const result = await response.json();
    console.log(result);
    setUrlInput("");
  };

  return (
    <div className="w-full mx-auto gap-6 flex flex-col p-4">
      <header className="w-full flex items-center justify-between space-x-2">
        {!isLoading && user ? name : <Link to="/auth/login">Login</Link>}
        <Link to="/dashboard/monitors">Dashboard</Link>
        <Button variant={"outline"} size={"sm"} onClick={signOut}>
          Sign Out
        </Button>
      </header>
      <div className="w-full max-w-xl mx-auto gap-6 flex flex-col py-8 px-4">
        <div className="text-center space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Blinks</h1>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
          <div className="gap-1.5 flex-col flex">
            <Label htmlFor="url">URL</Label>
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

          <Button type="submit" className="mt-2">
            Check Url
          </Button>
        </form>
      </div>
    </div>
  );
}
