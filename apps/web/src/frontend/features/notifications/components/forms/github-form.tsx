import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Label } from "@/frontend/components/ui/label";
import { Switch } from "@/frontend/components/ui/switch";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { Notifications } from "../../types";

interface GitHubFormProps {
  config: Notifications;
  onSave: (updates: Partial<Notifications>) => Promise<void>;
  isLoading: boolean;
}

const githubFormSchema = z
  .object({
    enabled: z.boolean(),
    owner: z.string(),
    repo: z.string(),
    token: z.string(),
  })
  .refine(
    (data) => {
      if (data.enabled) {
        return (
          data.owner &&
          data.owner.trim() !== "" &&
          data.repo &&
          data.repo.trim() !== "" &&
          data.token &&
          data.token.trim() !== ""
        );
      }
      return true;
    },
    {
      message: "All fields are required when GitHub notifications are enabled",
    }
  );

export function GitHubForm({ config, onSave, isLoading }: GitHubFormProps) {
  const form = useForm({
    defaultValues: {
      enabled: config.github_enabled,
      owner: config.github_owner || "",
      repo: config.github_repo || "",
      token: config.github_token || "",
    },
    validators: {
      onChange: githubFormSchema,
    },
    onSubmit: async ({ value }) => {
      await onSave({
        github_enabled: value.enabled,
        github_owner: value.enabled ? value.owner || null : null,
        github_repo: value.enabled ? value.repo || null : null,
        github_token: value.enabled ? value.token || null : null,
      });
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
      className="flex h-full flex-col justify-between space-y-8"
    >
      <div className="space-y-8">
        <form.Field name="enabled">
          {(field) => (
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="github-enabled" className="font-medium">
                  Enable GitHub Notifications
                </Label>
                <p className="text-muted-foreground text-sm">
                  Create and manage issues automatically when monitors fail.
                </p>
              </div>
              <Switch
                id="github-enabled"
                checked={field.state.value}
                onCheckedChange={field.handleChange}
              />
            </div>
          )}
        </form.Field>

        <form.Field name="enabled">
          {(enabledField) =>
            enabledField.state.value && (
              <div className="space-y-4">
                <form.Field name="owner">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor="owner">Repository Owner *</Label>
                      <Input
                        id="owner"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        placeholder="myorg"
                      />
                      {field.state.meta.errors &&
                        field.state.meta.errors.length > 0 && (
                          <p className="text-xs text-red-500">
                            {String(field.state.meta.errors[0])}
                          </p>
                        )}
                      <p className="text-muted-foreground text-xs">
                        GitHub username or organization name
                      </p>
                    </div>
                  )}
                </form.Field>

                <form.Field name="repo">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor="repo">Repository Name *</Label>
                      <Input
                        id="repo"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        placeholder="infrastructure"
                      />
                      {field.state.meta.errors &&
                        field.state.meta.errors.length > 0 && (
                          <p className="text-xs text-red-500">
                            {String(field.state.meta.errors[0])}
                          </p>
                        )}
                      <p className="text-muted-foreground text-xs">
                        Name of the repository where issues will be created
                      </p>
                    </div>
                  )}
                </form.Field>

                <form.Field name="token">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor="token">GitHub Token *</Label>
                      <Input
                        id="token"
                        type="password"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        placeholder="ghp_..."
                      />
                      {field.state.meta.errors &&
                        field.state.meta.errors.length > 0 && (
                          <p className="text-xs text-red-500">
                            {String(field.state.meta.errors[0])}
                          </p>
                        )}
                      <p className="text-muted-foreground text-xs">
                        Personal access token with issues:write permission
                      </p>
                    </div>
                  )}
                </form.Field>
              </div>
            )
          }
        </form.Field>
      </div>

      <div className="flex justify-end">
        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
        >
          {([canSubmit, isSubmitting]) => (
            <Button
              type="submit"
              size={"sm"}
              disabled={!canSubmit || isSubmitting || isLoading}
            >
              {isSubmitting || isLoading ? "Saving..." : "Save Configuration"}
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  );
}
