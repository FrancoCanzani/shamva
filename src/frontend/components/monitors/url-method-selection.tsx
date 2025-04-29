"use client";

import type React from "react";

import type { Dispatch, SetStateAction } from "react";
import { FormState } from "../pages/new-monitor-page";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

interface UrlMethodSectionProps {
  formData: FormState;
  setFormData: Dispatch<SetStateAction<FormState>>;
  errors: Record<string, string>;
  setErrors: Dispatch<SetStateAction<Record<string, string>>>;
}

export function UrlMethodSection({
  formData,
  setFormData,
  errors,
  setErrors,
}: UrlMethodSectionProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleMethodChange = (value: string) => {
    const newMethod = value as FormState["method"];
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

  return (
    <div className="space-y-4">
      <h2 className="font-medium">Request Configuration</h2>

      <div className="flex items-center justify-start gap-2">
        <div className="space-y-2">
          <Label htmlFor="method">Method</Label>
          <Select onValueChange={handleMethodChange} value={formData.method}>
            <SelectTrigger
              id="method"
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
        <div className="space-y-2 flex-1">
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
      </div>
    </div>
  );
}
