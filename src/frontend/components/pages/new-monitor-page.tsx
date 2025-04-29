import { MonitorFormSchema } from "@/frontend/lib/schemas";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { HeadersBodySection } from "../monitors/headers-body-selection";
import { RegionsSection } from "../monitors/regions-section";
import { UrlMethodSection } from "../monitors/url-method-selection";
import { Button } from "../ui/button";

export type FormState = {
  url: string;
  method: "GET" | "POST" | "HEAD";
  regions: string[];
  headersString: string;
  bodyString: string;
};

export default function NewMonitorPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<FormState>({
    url: "",
    method: "GET",
    regions: [],
    headersString: "",
    bodyString: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const validationResult = MonitorFormSchema.safeParse(formData);

    if (!validationResult.success) {
      const newErrors: Record<string, string> = {};
      validationResult.error.errors.forEach((err) => {
        if (err.path[0]) {
          newErrors[err.path[0].toString()] = err.message;
        }
      });
      setErrors(newErrors);
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    if (!validateForm()) {
      setIsSubmitting(false);
      return;
    }

    try {
      const parsedHeaders = formData.headersString
        ? JSON.parse(formData.headersString)
        : undefined;

      const parsedBody =
        formData.method === "POST" && formData.bodyString
          ? JSON.parse(formData.bodyString)
          : undefined;

      const monitorRequest = {
        url: formData.url,
        method: formData.method,
        regions: formData.regions,
        headers: parsedHeaders,
        body: parsedBody,
      };

      console.log("Creating monitor with data:", monitorRequest);

      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success("Monitor created successfully");
      navigate({ to: "/dashboard/monitors" });
    } catch (error) {
      console.error("Error creating monitor:", error);
      toast.error(
        error instanceof Error ? error.message : "An unexpected error occurred",
      );
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

        <div onSubmit={handleSubmit} className="space-y-8">
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
              onClick={() => navigate({ to: "/dashboard" })}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Monitor"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
