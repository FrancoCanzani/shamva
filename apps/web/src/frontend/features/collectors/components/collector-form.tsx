import { Button } from "@/frontend/components/ui/button";
import { ErrorMessage } from "@/frontend/components/ui/form-error-message";
import { FormField } from "@/frontend/components/ui/form-field";
import { Input } from "@/frontend/components/ui/input";
import { Label } from "@/frontend/components/ui/label";
import { CollectorSchema } from "@/frontend/lib/schemas";
import { cn } from "@/frontend/lib/utils";
import { useForm } from "@tanstack/react-form";
import { Check, Copy } from "lucide-react";
import { useMemo, useState } from "react";
import { z } from "zod";
import { generateCollectorToken } from "../utils";

export type CollectorFormValues = z.infer<typeof CollectorSchema>;

interface CollectorFormProps {
  onSubmit: (values: CollectorFormValues & { token?: string }) => Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
  defaultValues?: Partial<CollectorFormValues>;
  isEdit?: boolean;
}

export default function CollectorForm({
  onSubmit,
  onCancel,
  isSubmitting,
  submitLabel = "Save",
  defaultValues,
  isEdit = false,
}: CollectorFormProps) {
  const [copied, setCopied] = useState(false);

  const generatedToken = useMemo(() => generateCollectorToken(), []);

  const defaultFormValues: CollectorFormValues = {
    name: defaultValues?.name || "",
  };

  const form = useForm({
    defaultValues: defaultFormValues,
    validators: {
      onChange: ({ value }) => {
        const result = CollectorSchema.safeParse(value);
        if (result.success) return undefined;

        const fieldErrors: Record<string, string> = {};

        for (const issue of result.error.issues) {
          const path = issue.path.join(".");
          if (path && !fieldErrors[path]) {
            fieldErrors[path] = issue.message;
          }
        }
        return { fields: fieldErrors };
      },
    },
    onSubmit: async ({ value }) => {
      await onSubmit({
        ...value,
        ...(isEdit ? {} : { token: generatedToken }),
      });
    },
  });

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="flex gap-8">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
        className="flex-1 space-y-8"
      >
        <FormField>
          <form.Field name="name">
            {(field) => (
              <>
                <Label htmlFor="name">Collector name</Label>
                <Input
                  id="name"
                  name="name"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder="Production Server"
                  className={cn(
                    "w-full",
                    field.state.meta.errors?.length && "border-destructive"
                  )}
                />
                {field.state.meta.errors?.length > 0 && (
                  <ErrorMessage errors={field.state.meta.errors[0]} />
                )}
              </>
            )}
          </form.Field>
        </FormField>

        {!isEdit && (
          <FormField>
            <Label>Auth Token</Label>
            <div className="flex gap-2">
              <div className="inline-flex h-9 flex-1 items-center rounded-md border px-3 shadow-xs">
                <code className="text-xs break-all">{generatedToken}</code>
              </div>
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="h-9"
                onClick={copyToClipboard}
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              This token will be used to authenticate the collector agent. Copy
              it now as it won't be shown again.
            </p>
          </FormField>
        )}

        <div className="flex justify-end space-x-4">
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
          >
            {([canSubmit, formIsSubmitting]) => (
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting || formIsSubmitting || !canSubmit}
              >
                {isSubmitting || formIsSubmitting
                  ? "Submitting..."
                  : submitLabel}
              </Button>
            )}
          </form.Subscribe>
        </div>
      </form>
    </div>
  );
}
