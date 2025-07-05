import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Label } from "@/frontend/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/frontend/components/ui/select";
import { Separator } from "@/frontend/components/ui/separator";
import { Textarea } from "@/frontend/components/ui/textarea";
import { useForm } from "@tanstack/react-form";
import { X } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { z } from "zod";
import { useWorkspaces } from "../hooks/use-workspaces";
import { MemberInviteSchema, WorkspaceSchema } from "../lib/schemas";
import { MemberInvite, WorkspaceFormValues } from "../lib/types";

interface MonitorWorkspaceFormProps {
  initialValues?: Partial<WorkspaceFormValues>;
  onSubmit: (values: WorkspaceFormValues) => Promise<void>;
  onCancel: () => void;
  onDelete?: () => Promise<void>;
  isSubmitting: boolean;
  submitLabel: string;
}

const memberRoles = [
  { value: "admin", label: "Admin" },
  { value: "member", label: "Member" },
  { value: "viewer", label: "Viewer" },
];

export default function WorkspaceForm({
  initialValues,
  onSubmit,
  onCancel,
  onDelete,
  isSubmitting,
  submitLabel,
}: MonitorWorkspaceFormProps) {
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [newMemberEmail, setNewMemberEmail] = React.useState("");
  const [newMemberRole, setNewMemberRole] =
    React.useState<MemberInvite["role"]>("member");
  const { workspaces } = useWorkspaces();

  const defaultValues = {
    name: "",
    description: undefined,
    members: [],
    ...initialValues,
  };

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      await onSubmit(value);
    },
    validators: {
      onChange: ({ value }) => {
        try {
          WorkspaceSchema.parse(value);
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

  const handleDelete = async () => {
    if (!onDelete) {
      return;
    }

    setIsDeleting(true);
    try {
      await onDelete();
      toast.success("Workspace deleted successfully");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete workspace"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className="space-y-8"
    >
      <div className="space-y-2">
        <form.Field
          name="name"
          validators={{
            onChange: ({ value }) => {
              if (!initialValues?.name) {
                const nameExists = workspaces?.some(
                  (workspace) =>
                    workspace.name.toLowerCase() === value.toLowerCase()
                );

                if (nameExists) {
                  return "This workspace name is already taken";
                }
              }
              return undefined;
            },
          }}
        >
          {(field) => (
            <>
              <Label htmlFor="name">Workspace Name</Label>
              <Input
                id="name"
                name="name"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                placeholder="my-monitor-workspace"
                className={
                  field.state.meta.errors?.length ? "border-destructive" : ""
                }
              />
              <p className="text-muted-foreground mt-1 text-sm">
                This will be part of the URL for your workspace. Use only
                lowercase letters, numbers, and hyphens.
              </p>
              {field.state.meta.errors?.length > 0 && (
                <p className="text-destructive text-sm">
                  {field.state.meta.errors[0]}
                </p>
              )}
            </>
          )}
        </form.Field>
      </div>

      <div className="space-y-2">
        <form.Field name="description">
          {(field) => (
            <>
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                name="description"
                value={field.state.value || ""}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                placeholder="Describe the purpose of this workspace"
                className={
                  field.state.meta.errors?.length ? "border-destructive" : ""
                }
                rows={3}
              />
              {field.state.meta.errors?.length > 0 && (
                <p className="text-destructive text-sm">
                  {field.state.meta.errors[0]}
                </p>
              )}
            </>
          )}
        </form.Field>
      </div>

      <Separator />

      <div className="">
        <h2 className="text-lg font-medium">Invite Team Members</h2>
        <p className="text-muted-foreground mb-4 text-xs">
          Each invited member will receive an email they must accept to join.
          <br />
          <br />- <strong>Admin:</strong> Full access to manage monitors,
          members, and workspace settings.
          <br />- <strong>Member:</strong> Can create and manage monitors, but
          cannot manage workspace members or settings.
          <br />- <strong>Viewer:</strong> Can only view monitors and logs, no
          management capabilities.
        </p>
        <form.Field name="members" mode="array">
          {(membersApi) => (
            <>
              <div className="flex items-end gap-2">
                <div className="flex-1 space-y-1.5">
                  <Label htmlFor="newMemberEmail">Member Email</Label>
                  <Input
                    id="newMemberEmail"
                    type="email"
                    placeholder="teammate@example.com"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="newMemberRole" className="mb-1.5">
                    Role
                  </Label>
                  <Select
                    value={newMemberRole}
                    onValueChange={(value) =>
                      setNewMemberRole(value as MemberInvite["role"])
                    }
                  >
                    <SelectTrigger id="newMemberRole" className="w-[120px]">
                      <SelectValue placeholder="Role" defaultValue={"Viewer"} />
                    </SelectTrigger>
                    <SelectContent>
                      {memberRoles.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    try {
                      const validatedMember = MemberInviteSchema.parse({
                        email: newMemberEmail,
                        role: newMemberRole,
                      });

                      if (
                        membersApi.state.value?.some(
                          (member: MemberInvite) =>
                            member.email === newMemberEmail
                        )
                      ) {
                        toast.error("This member has already been added.");
                        return;
                      }

                      membersApi.pushValue(validatedMember);
                      setNewMemberEmail("");
                      setNewMemberRole("member");
                    } catch (error) {
                      if (error instanceof z.ZodError) {
                        error.errors.forEach((err) => {
                          toast.error(err.message);
                        });
                      } else {
                        toast.error("Failed to add member");
                      }
                    }
                  }}
                  className="shrink-0"
                >
                  Add Member
                </Button>
              </div>

              {(membersApi.state.value?.length ?? 0) > 0 && (
                <div className="mt-4 border p-2">
                  <h3 className="text-muted-foreground text-sm font-medium">
                    Pending Invitations
                  </h3>
                  <div className="divide-y divide-dashed">
                    {membersApi.state.value?.map(
                      (member: MemberInvite, index: number) => (
                        <div
                          key={`member-${index}`}
                          className="flex items-center justify-between gap-2 py-2"
                        >
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">
                              {member.email}
                            </span>
                            <span className="text-muted-foreground text-xs capitalize">
                              {member.role}
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-destructive size-7"
                            onClick={() => membersApi.removeValue(index)}
                            aria-label="Remove member"
                          >
                            <X className="size-4" />
                          </Button>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
              {membersApi.state.meta.errors &&
                typeof membersApi.state.meta.errors[0] === "string" && (
                  <p className="text-destructive text-sm">
                    {membersApi.state.meta.errors[0]}
                  </p>
                )}
            </>
          )}
        </form.Field>
      </div>

      <div className="flex justify-between space-x-4 pt-4">
        <div>
          {onDelete && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={isSubmitting || isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Workspace"}
            </Button>
          )}
        </div>
        <div className="flex space-x-4">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={isSubmitting || isDeleting}
          >
            Cancel
          </Button>

          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isDirty]}
          >
            {([canSubmit, isDirty]) => (
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting || !canSubmit || !isDirty || isDeleting}
              >
                {isSubmitting ? "Creating..." : submitLabel}
              </Button>
            )}
          </form.Subscribe>
        </div>
      </div>
    </form>
  );
}
