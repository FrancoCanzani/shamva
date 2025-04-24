import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Label } from "@/frontend/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/frontend/components/ui/select";
import { Textarea } from "@/frontend/components/ui/textarea";
import { useAuth } from "@/frontend/lib/context/auth-context";
import {
  ApiResponse,
  CreateMonitorRequest,
  Monitor,
} from "@/frontend/lib/types";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

const monitorFormSchema = z.object({
  url: z.string().url("Please enter a valid URL"),
  headers: z.string().optional(),
  method: z.enum(["GET", "POST", "HEAD"]),
  body: z.string().optional(),
});

type MonitorFormData = z.infer<typeof monitorFormSchema>;

export const Route = createFileRoute("/dashboard/monitors/")({
  component: MonitorsComponent,
});

function MonitorsComponent() {
  const { session } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<MonitorFormData>({
    url: "",
    headers: "",
    method: "GET",
    body: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleMethodChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      method: value as MonitorFormData["method"],
    }));
    setErrors((prev) => ({ ...prev, method: "" }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      const validatedForm = monitorFormSchema.parse(formData);

      let parsedHeaders: Record<string, string> = {};
      let parsedBody = null;

      try {
        if (validatedForm.headers && validatedForm.headers.trim()) {
          parsedHeaders = JSON.parse(validatedForm.headers);
        }

        if (
          validatedForm.method === "POST" &&
          validatedForm.body &&
          validatedForm.body.trim()
        ) {
          parsedBody = JSON.parse(validatedForm.body);
        }
      } catch {
        setErrors({
          ...(validatedForm.headers && {
            headers: "Invalid JSON format in headers",
          }),
          ...(validatedForm.body && { body: "Invalid JSON format in body" }),
        });
        setIsSubmitting(false);
        return;
      }

      if (!session?.access_token) {
        throw new Error("No authentication token found");
      }

      const monitorRequest: CreateMonitorRequest = {
        url: validatedForm.url,
        method: validatedForm.method,
        headers: parsedHeaders,
        body: parsedBody,
      };

      const response = await fetch("/api/monitors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(monitorRequest),
      });

      const result: ApiResponse<Monitor> = await response.json();

      if (result.success && result.data) {
        toast.success("Monitor created successfully");
        setFormData({ url: "", headers: "", method: "GET", body: "" });
      } else {
        toast.error(result.error || "Failed to create monitor");
        if (result.details) {
          console.error("Error details:", result.details);
        }
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(newErrors);
      } else {
        console.error("Error creating monitor:", error);
        toast.error(
          error instanceof Error ? error.message : "Failed to create monitor",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4">
      <h1 className="font-medium mb-6">URL Monitors</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-end justify-start space-x-2">
          <div className="">
            <Label htmlFor="method" className="mb-2">
              Method
            </Label>
            <Select onValueChange={handleMethodChange} value={formData.method}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Select a method" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="HEAD">HEAD</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            {errors.method && (
              <p className="text-sm text-destructive">{errors.method}</p>
            )}
          </div>
          <div className="flex-1">
            <Label htmlFor="url" className="mb-2">
              URL to Monitor
            </Label>
            <Input
              id="url"
              name="url"
              value={formData.url}
              onChange={handleChange}
              placeholder="https://example.com/api"
            />
            {errors.url && (
              <p className="text-sm text-destructive">{errors.url}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="headers">Headers (JSON)</Label>
          <Textarea
            id="headers"
            name="headers"
            value={formData.headers}
            onChange={handleChange}
            placeholder='{"Authorization": "Bearer token"}'
          />
          {errors.headers && (
            <p className="text-sm text-destructive">{errors.headers}</p>
          )}
        </div>

        {formData.method === "POST" && (
          <div className="space-y-2">
            <Label htmlFor="body">Request Body (JSON)</Label>
            <Textarea
              id="body"
              name="body"
              value={formData.body}
              onChange={handleChange}
              placeholder='{"key": "value"}'
            />
            {errors.body && (
              <p className="text-sm text-destructive">{errors.body}</p>
            )}
          </div>
        )}

        <Button type="submit" variant={"outline"} disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Create Monitor"}
        </Button>
      </form>
    </div>
  );
}
