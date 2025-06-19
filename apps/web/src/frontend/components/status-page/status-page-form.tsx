import { StatusPageSchema } from "@/frontend/lib/schemas";
import { Monitor, StatusPageFormValues } from "@/frontend/lib/types";
import { cn } from "@/frontend/lib/utils";
import { useForm } from "@tanstack/react-form";
import { Check, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";

interface StatusPageFormProps {
  initialValues?: Partial<StatusPageFormValues>;
  onSubmit: (values: StatusPageFormValues) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
  submitLabel: string;
  availableMonitors: Monitor[];
}

export default function StatusPageForm({
  initialValues,
  onSubmit,
  onCancel,
  isSubmitting,
  submitLabel,
  availableMonitors,
}: StatusPageFormProps) {
  const [showPassword, setShowPassword] = useState(false);

  const defaultValues: StatusPageFormValues = {
    slug: "",
    title: "",
    description: "",
    showValues: true,
    password: "",
    isPublic: true,
    monitors: [],
    ...initialValues,
  };

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      try {
        await onSubmit(value);
      } catch (error) {
        console.error("Error submitting form:", error);
        throw error;
      }
    },
    validators: {
      onChange: ({ value }) => {
        try {
          StatusPageSchema.parse(value);
          return undefined;
        } catch (error) {
          if (error instanceof z.ZodError) {
            const fieldErrors: Record<string, string> = {};
            error.errors.forEach((err) => {
              const path = err.path.join(".");
              fieldErrors[path] = err.message;
            });

            return {
              fields: fieldErrors,
            };
          }
          return { form: "Invalid form data" };
        }
      },
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className="space-y-8"
    >
      <div className="space-y-4">
        <h2 className="font-medium">Basic Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <form.Field name="title">
              {(field) => (
                <>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    name="title"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    placeholder="My Service Status"
                    className={
                      field.state.meta.errors?.length
                        ? "border-destructive"
                        : ""
                    }
                  />
                  {field.state.meta.errors?.length > 0 && (
                    <p className="text-sm text-destructive">
                      {field.state.meta.errors[0]}
                    </p>
                  )}
                </>
              )}
            </form.Field>
          </div>

          <div className="space-y-2">
            <form.Field name="slug">
              {(field) => (
                <>
                  <Label htmlFor="slug">URL Slug</Label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l border border-r-0 border-input bg-muted text-muted-foreground text-sm">
                      /status/
                    </span>
                    <Input
                      id="slug"
                      name="slug"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="my-service"
                      className={cn(
                        "rounded-l-none",
                        field.state.meta.errors?.length
                          ? "border-destructive"
                          : "",
                      )}
                    />
                  </div>
                  {field.state.meta.errors?.length > 0 && (
                    <p className="text-sm text-destructive">
                      {field.state.meta.errors[0]}
                    </p>
                  )}
                </>
              )}
            </form.Field>
          </div>
        </div>

        <div className="space-y-2">
          <form.Field name="description">
            {(field) => (
              <>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder="Real-time status and uptime monitoring for our services"
                  rows={3}
                  className={
                    field.state.meta.errors?.length ? "border-destructive" : ""
                  }
                />
                {field.state.meta.errors?.length > 0 && (
                  <p className="text-sm text-destructive">
                    {field.state.meta.errors[0]}
                  </p>
                )}
              </>
            )}
          </form.Field>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="font-medium">Display Settings</h2>
        <div className="space-y-4">
          <form.Field name="showValues">
            {(field) => (
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="showValues"
                  checked={field.state.value}
                  onChange={(e) => field.handleChange(e.target.checked)}
                  className="rounded border-input"
                />
                <Label htmlFor="showValues" className="text-sm">
                  Show response times and uptime percentages
                </Label>
                <p className="text-xs text-muted-foreground">
                  When disabled, only shows operational status
                </p>
              </div>
            )}
          </form.Field>

          <form.Field name="isPublic">
            {(field) => (
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={field.state.value}
                  onChange={(e) => field.handleChange(e.target.checked)}
                  className="rounded border-input"
                />
                <Label htmlFor="isPublic" className="text-sm">
                  Make status page publicly accessible
                </Label>
              </div>
            )}
          </form.Field>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="font-medium">Security</h2>
        <div className="space-y-2">
          <form.Field name="password">
            {(field) => (
              <>
                <Label htmlFor="password">Password Protection (Optional)</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    placeholder="Leave empty for no password protection"
                    className={
                      field.state.meta.errors?.length
                        ? "border-destructive"
                        : ""
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {field.state.meta.errors?.length > 0 && (
                  <p className="text-sm text-destructive">
                    {field.state.meta.errors[0]}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Visitors will need to enter this password to view the status
                  page
                </p>
              </>
            )}
          </form.Field>
        </div>
      </div>

      <div className="space-y-4">
        <form.Field name="monitors">
          {(field) => (
            <>
              <div className="flex gap-1.5 flex-col items-start justify-between">
                <h2 className="font-medium">Select Monitors</h2>
                <span className="text-sm text-muted-foreground">
                  {field.state.value.length} monitor
                  {field.state.value.length !== 1 ? "s" : ""} selected
                </span>
              </div>

              <div className="border rounded border-dashed p-4">
                {availableMonitors.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No monitors available in this workspace. Create some
                    monitors first.
                  </p>
                ) : (
                  <div className="grid gap-2">
                    {availableMonitors.map((monitor) => {
                      const isSelected = field.state.value.includes(monitor.id);

                      return (
                        <div
                          key={monitor.id}
                          className={`flex items-center justify-between p-3 border rounded cursor-pointer hover:bg-slate-50 transition-colors ${
                            isSelected ? "border-primary bg-slate-50" : ""
                          }`}
                          onClick={() => {
                            const newMonitors = isSelected
                              ? field.state.value.filter(
                                  (id) => id !== monitor.id,
                                )
                              : [...field.state.value, monitor.id];
                            field.handleChange(newMonitors);
                          }}
                          role="checkbox"
                          aria-checked={isSelected}
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === " " || e.key === "Enter") {
                              e.preventDefault();
                              const newMonitors = isSelected
                                ? field.state.value.filter(
                                    (id) => id !== monitor.id,
                                  )
                                : [...field.state.value, monitor.id];
                              field.handleChange(newMonitors);
                            }
                          }}
                        >
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">
                              {monitor.name || monitor.url}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {monitor.url}
                            </span>
                          </div>
                          {isSelected && (
                            <Check className="h-4 w-4 text-primary" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {field.state.meta.errors?.length > 0 && (
                <p className="text-sm text-destructive">
                  {field.state.meta.errors[0]}
                </p>
              )}
            </>
          )}
        </form.Field>
      </div>

      <div className="flex justify-end space-x-4">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
