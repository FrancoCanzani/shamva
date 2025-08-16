import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Label } from "@/frontend/components/ui/label";
import { ApiResponse, PublicStatusPageData } from "@/frontend/lib/types";
import type React from "react";
import { useState } from "react";

export default function StatusPagePasswordForm({
  slug,
  onSuccess,
}: {
  slug: string;
  onSuccess: (data: PublicStatusPageData) => void;
}) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/status/${slug}?password=${encodeURIComponent(password)}`
      );

      if (!response.ok) {
        setError("Failed to verify password");
        return;
      }

      const result: ApiResponse<PublicStatusPageData> = await response.json();

      if (!result.success || !result.data) {
        setError(result.error || "Invalid password");
        return;
      }

      onSuccess(result.data);
    } catch (err) {
      console.error("Password verification error:", err);
      setError("Failed to verify password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 z-0 bg-gray-100"></div>
      <div className="relative z-10 mx-auto min-h-screen max-w-[600px] bg-transparent">
        <div className="absolute top-0 left-0 h-full w-[2px] border-l border-dashed border-[#8f8f8f]"></div>
        <div className="absolute top-0 right-0 h-full w-[2px] border-r border-dashed border-[#8f8f8f]"></div>

        <div className="px-6 py-12">
          <div className="border bg-white p-8">
            <div className="mb-8 text-center">
              <h1 className="mb-4 text-2xl text-black uppercase">
                PASSWORD REQUIRED
              </h1>
              <p className="text-sm text-[#525252]">
                This status page is password protected.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label
                  htmlFor="password"
                  className="text-xs text-black uppercase"
                >
                  Enter Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="-none mt-2 border-black focus:border-black focus:ring-0"
                  required
                />
              </div>

              {error && (
                <div className="border border-black bg-gray-50 p-4">
                  <p className="text-xs text-black">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="-none w-full bg-black text-xs text-white uppercase hover:bg-gray-800"
              >
                {loading ? "VERIFYING..." : "ACCESS STATUS PAGE"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
