import type { Dispatch, SetStateAction } from "react";
import { FormState } from "../pages/new-monitor-page";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";

interface HeadersBodySectionProps {
  formData: FormState;
  setFormData: Dispatch<SetStateAction<FormState>>;
  errors: Record<string, string>;
  setErrors: Dispatch<SetStateAction<Record<string, string>>>;
}

export function HeadersBodySection({
  formData,
  setFormData,
  errors,
  setErrors,
}: HeadersBodySectionProps) {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="font-medium">Advanced Options</h2>

      <div className="space-y-4 border rounded-sm p-4 bg-slate-50/10">
        <div className="space-y-2">
          <Label htmlFor="headersString">Headers (JSON String)</Label>
          <Textarea
            id="headersString"
            name="headersString"
            value={formData.headersString}
            onChange={handleChange}
            placeholder='{"Authorization": "Bearer token", "Content-Type": "application/json"}'
            rows={3}
            className={errors.headersString ? "border-destructive" : ""}
          />
          {errors.headersString && (
            <p className="text-sm text-destructive">{errors.headersString}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Enter headers as a valid JSON object
          </p>
        </div>

        {formData.method === "POST" && (
          <div className="space-y-2">
            <Label htmlFor="bodyString">Request Body (JSON String)</Label>
            <Textarea
              id="bodyString"
              name="bodyString"
              value={formData.bodyString}
              onChange={handleChange}
              placeholder='{"key": "value"}'
              rows={4}
              className={errors.bodyString ? "border-destructive" : ""}
            />
            {errors.bodyString && (
              <p className="text-sm text-destructive">{errors.bodyString}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Only applicable for POST requests
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
