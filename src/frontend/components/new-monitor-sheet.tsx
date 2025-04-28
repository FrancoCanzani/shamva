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
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/frontend/components/ui/sheet";
import { Textarea } from "@/frontend/components/ui/textarea";
import { useAuth } from "@/frontend/lib/context/auth-context";
import {
  ApiResponse,
  CreateMonitorRequest,
  Monitor,
} from "@/frontend/lib/types";
import React, { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

const monitorFormSchema = z
  .object({
    url: z.string().trim().url("Please enter a valid URL"),
    method: z.enum(["GET", "POST", "HEAD"], {
      errorMap: () => ({ message: "Please select a valid method" }),
    }),
    headersString: z
      .string()
      .trim()
      .optional()
      .nullable()
      .refine(
        (val) => {
          if (!val || val === "") return true;
          try {
            const parsed = JSON.parse(val);
            return (
              typeof parsed === "object" &&
              parsed !== null &&
              !Array.isArray(parsed)
            );
          } catch {
            return false;
          }
        },
        { message: "Headers must be a valid JSON object" },
      ),
    bodyString: z
      .string()
      .trim()
      .optional()
      .nullable()
      .refine(
        (val) => {
          if (!val || val === "") return true;
          try {
            JSON.parse(val);
            return true;
          } catch {
            return false;
          }
        },
        { message: "Body must be valid JSON" },
      ),
  })
  .refine(
    (data) =>
      !(data.method !== "POST" && data.bodyString && data.bodyString !== ""),
    {
      message: "Request body is only applicable for POST method",
      path: ["bodyString"],
    },
  );

type MonitorFormState = {
  url: string;
  method: "GET" | "POST" | "HEAD";
  headersString: string;
  bodyString: string;
};

export default function CreateMonitorSheet() {
  const { session } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<MonitorFormState>({
    url: "",
    headersString: "",
    method: "GET",
    bodyString: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetForm = () => {
    setFormData({ url: "", headersString: "", method: "GET", bodyString: "" });
    setErrors({});
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleMethodChange = (value: string) => {
    const newMethod = value as MonitorFormState["method"];
    setFormData((prev) => ({
      ...prev,
      method: newMethod,
      bodyString: newMethod !== "POST" ? "" : prev.bodyString,
    }));

    if (errors.method || (newMethod !== "POST" && errors.bodyString)) {
      setErrors((prev) => ({
        ...prev,
        method: "",
        ...(newMethod !== "POST" ? { bodyString: "" } : {}),
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    const validationResult = monitorFormSchema.safeParse(formData);

    if (!validationResult.success) {
      const newErrors: Record<string, string> = {};
      validationResult.error.errors.forEach((err) => {
        if (err.path[0]) {
          newErrors[err.path[0].toString()] = err.message;
        }
      });
      setErrors(newErrors);
      setIsSubmitting(false);
      return;
    }

    if (!session?.access_token) {
      toast.error("Authentication error. Please log in again.");
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

      const monitorRequest: CreateMonitorRequest = {
        url: formData.url,
        method: formData.method,
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

      if (response.ok && result.success && result.data) {
        toast.success("Monitor created successfully");
        resetForm();
        setIsOpen(false);
      } else {
        toast.error(result.error || "Failed to create monitor");
      }
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
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline">Add New Monitor</Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-[520px]">
        <SheetHeader>
          <SheetTitle>Create New Monitor</SheetTitle>
          <SheetDescription>
            Enter the details for the URL you want to monitor.
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="url">URL to Monitor</Label>
            <Input
              id="url"
              name="url"
              value={formData.url}
              onChange={handleChange}
              placeholder="https://example.com/api"
              className={errors.url ? "border-destructive" : ""}
            />
            {errors.url && (
              <p className="text-sm text-destructive">{errors.url}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="method">Method</Label>
            <Select
              onValueChange={handleMethodChange}
              value={formData.method}
              name="method"
            >
              <SelectTrigger
                className={errors.method ? "border-destructive" : ""}
              >
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

          <div className="grid gap-2">
            <Label htmlFor="headersString">Headers (JSON String)</Label>
            <Textarea
              id="headersString"
              name="headersString"
              value={formData.headersString || ""}
              onChange={handleChange}
              placeholder='{"Authorization": "Bearer token", "Content-Type": "application/json"}'
              rows={3}
              className={errors.headersString ? "border-destructive" : ""}
            />
            {errors.headersString && (
              <p className="text-sm text-destructive">{errors.headersString}</p>
            )}
          </div>

          {formData.method === "POST" && (
            <div className="grid gap-2">
              <Label htmlFor="bodyString">Request Body (JSON String)</Label>
              <Textarea
                id="bodyString"
                name="bodyString"
                value={formData.bodyString || ""}
                onChange={handleChange}
                placeholder='{"key": "value"}'
                rows={4}
                className={errors.bodyString ? "border-destructive" : ""}
              />
              {errors.bodyString && (
                <p className="text-sm text-destructive">{errors.bodyString}</p>
              )}
            </div>
          )}
          <SheetFooter className="mt-6">
            <SheetClose asChild>
              <Button type="button" variant="ghost" onClick={resetForm}>
                Cancel
              </Button>
            </SheetClose>
            <Button type="submit" variant="outline" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Monitor"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
