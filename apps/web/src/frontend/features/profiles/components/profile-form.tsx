import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Label } from "@/frontend/components/ui/label";
import { ProfileSchema } from "@/frontend/lib/schemas";
import { ProfileFormValues } from "@/frontend/lib/types";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";

interface ProfileFormProps {
  initialValues?: Partial<ProfileFormValues>;
  onSubmit: (values: ProfileFormValues) => Promise<void>;
  onCancel?: () => void;
  isSubmitting: boolean;
  submitLabel: string;
}

export default function ProfileForm({
  initialValues,
  onSubmit,
  onCancel,
  isSubmitting,
  submitLabel,
}: ProfileFormProps) {
  const defaultValues = {
    first_name: "",
    last_name: "",
    ...initialValues,
  };

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      try {
        await onSubmit(value);
      } catch (error) {
        console.error("Form submission error:", error);
      }
    },
    validators: {
      onChange: ({ value }) => {
        const result = ProfileSchema.safeParse(value);
        if (!result.success) {
          const flattened = z.flattenError(result.error);
          return {
            fields: flattened.fieldErrors,
            form: flattened.formErrors,
          };
        }
        return undefined;
      },
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className="space-y-4"
    >
      <div className="space-y-6">
        <form.Field name="first_name">
          {(field) => (
            <div>
              <Label
                htmlFor="first_name"
                className="block text-sm font-medium text-gray-700"
              >
                First Name
              </Label>
              <Input
                id="first_name"
                name="first_name"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                placeholder="First name"
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                  field.state.meta.errors?.length ? "border-red-300" : ""
                }`}
              />
              {field.state.meta.errors?.length > 0 && (
                <p className="mt-1 text-xs text-red-600">
                  {field.state.meta.errors[0]}
                </p>
              )}
            </div>
          )}
        </form.Field>

        <form.Field name="last_name">
          {(field) => (
            <div>
              <Label
                htmlFor="last_name"
                className="block text-sm font-medium text-gray-700"
              >
                Last Name
              </Label>
              <Input
                id="last_name"
                name="last_name"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                placeholder="Last name"
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                  field.state.meta.errors?.length ? "border-red-300" : ""
                }`}
              />
              {field.state.meta.errors?.length > 0 && (
                <p className="mt-1 text-xs text-red-600">
                  {field.state.meta.errors[0]}
                </p>
              )}
            </div>
          )}
        </form.Field>
      </div>

      <div className="flex items-center justify-between pt-6">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="text-sm hover:underline"
          >
            Skip
          </button>
        )}
        <form.Subscribe selector={(state) => [state.canSubmit, state.isDirty]}>
          {([canSubmit]) => (
            <Button
              type="submit"
              disabled={isSubmitting || !canSubmit}
              size={"sm"}
            >
              {isSubmitting ? "Saving..." : submitLabel}
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  );
}
