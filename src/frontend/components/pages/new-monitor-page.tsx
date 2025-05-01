import { useAuth } from "@/frontend/lib/context/auth-context";
import { MonitorFormSchema } from "@/frontend/lib/schemas";
import { ApiResponse, Monitor } from "@/frontend/lib/types";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { BasicConfigSection } from "../monitors/basic-config-section";
import { HeadersBodySection } from "../monitors/headers-body-selection";
import { RegionsSection } from "../monitors/regions-section";
import { UrlMethodSection } from "../monitors/url-method-selection";
import { Button } from "../ui/button";

export type FormState = {
  name: string;
  url: string;
  method: "GET" | "POST" | "HEAD";
  interval: number;
  regions: string[];
  headersString: string;
  bodyString: string;
};

export default function NewMonitorPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { session } = useAuth();

  const [formData, setFormData] = useState<FormState>({
    name: "",
    url: "",
    method: "GET",
    interval: 60000,
    regions: [],
    headersString: "",
    bodyString: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    if (formData.regions.length === 0) {
      setErrors((prev) => ({
        ...prev,
        regions: "Please select at least one monitoring region.",
      }));
      return false;
    }

    const validationResult = MonitorFormSchema.safeParse(formData);

    if (!validationResult.success) {
      const newErrors: Record<string, string> = {};
      validationResult.error.errors.forEach((err) => {
        if (err.path[0]) {
          newErrors[err.path[0].toString()] = err.message;
        }
      });
      if (errors.regions && !newErrors.regions) {
        newErrors.regions = errors.regions;
      }
      setErrors(newErrors);
      return false;
    }

    if (errors.regions) {
      setErrors((prev) => {
        const { ...rest } = prev;
        return rest;
      });
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});
    if (!validateForm()) {
      setIsSubmitting(false);
      toast.error("Please fix the errors in the form.");
      return;
    }

    if (!session?.access_token) {
      toast.error("Authentication error. Please log in again.");
      setIsSubmitting(false);
      return;
    }

    try {
      let parsedHeaders: Record<string, string> | undefined = undefined;
      if (formData.headersString) {
        try {
          parsedHeaders = JSON.parse(formData.headersString);
          if (
            typeof parsedHeaders !== "object" ||
            Array.isArray(parsedHeaders) ||
            parsedHeaders === null
          ) {
            throw new Error("Headers must be a JSON object.");
          }
        } catch {
          setErrors((prev) => ({
            ...prev,
            headersString: "Invalid JSON format for headers.",
          }));
          setIsSubmitting(false);
          toast.error("Invalid JSON format for headers.");
          return;
        }
      }

      let parsedBody: Record<string, unknown> | string | undefined = undefined;
      if (formData.method === "POST" && formData.bodyString) {
        try {
          parsedBody = JSON.parse(formData.bodyString);
        } catch {
          setErrors((prev) => ({
            ...prev,
            bodyString: "Invalid JSON format for body.",
          }));
          setIsSubmitting(false);
          toast.error("Invalid JSON format for body.");
          return;
        }
      }

      const monitorRequest = {
        name: formData.name,
        url: formData.url,
        method: formData.method,
        interval: formData.interval,
        regions: formData.regions,
        headers: parsedHeaders,
        body: parsedBody,
      };

      console.log("Creating monitor with data:", monitorRequest);

      const response = await fetch("/api/monitors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(monitorRequest),
      });

      const result: ApiResponse<Monitor> = await response.json();

      if (!response.ok) {
        console.error("Error response from API:", result);
        throw new Error(
          result.error || `Failed to create monitor (${response.status})`,
        );
      }

      toast.success("Monitor created successfully");
      return navigate({ to: "/dashboard/monitors" });
    } catch (error) {
      console.error("Error creating monitor:", error);
      if (Object.keys(errors).length === 0) {
        toast.error(
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container max-w-4xl mx-auto p-4">
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-medium">Create New Monitor</h1>
          <p className="text-muted-foreground mt-1">
            Enter the details for the URL you want to monitor.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <BasicConfigSection
            formData={formData}
            setFormData={setFormData}
            errors={errors}
            setErrors={setErrors}
          />

          <UrlMethodSection
            formData={formData}
            setFormData={setFormData}
            errors={errors}
            setErrors={setErrors}
          />

          <RegionsSection
            selectedRegions={formData.regions}
            setFormData={setFormData}
            errors={errors}
            setErrors={setErrors}
          />

          <HeadersBodySection
            formData={formData}
            setFormData={setFormData}
            errors={errors}
            setErrors={setErrors}
          />

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="ghost"
              size={"sm"}
              onClick={() => navigate({ to: "/dashboard/monitors" })}
            >
              Cancel
            </Button>
            <Button type="submit" size={"sm"} disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Monitor"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
