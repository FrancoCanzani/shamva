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

const memberInviteSchema = z.object({
  email: z
    .string()
    .email("Please enter a valid email address")
    .min(1, "Email is required"),
  role: z.enum(["admin", "member", "viewer"], {
    errorMap: () => ({ message: "Please select a valid role" }),
  }),
});

const workspaceSchema = z.object({
  workspaceName: z
    .string()
    .min(1, "Workspace name is required")
    .max(100, "Workspace name cannot exceed 100 characters"),
  description: z
    .string()
    .max(500, "Description cannot exceed 500 characters")
    .optional(),
  members: z.array(memberInviteSchema),
});

export type MemberInvite = z.infer<typeof memberInviteSchema>;
export type MonitorWorkspaceFormValues = z.infer<typeof workspaceSchema>;

interface MonitorWorkspaceFormProps {
  initialValues?: Partial<MonitorWorkspaceFormValues>;
  onSubmit: (values: MonitorWorkspaceFormValues) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
  submitLabel: string;
}

const memberRoles = [
  { value: "admin", label: "Admin" },
  { value: "viewer", label: "Viewer" },
];

export default function MonitorWorkspaceForm({
  initialValues,
  onSubmit,
  onCancel,
  isSubmitting,
  submitLabel,
}: MonitorWorkspaceFormProps) {
  const [newMemberEmail, setNewMemberEmail] = React.useState("");
  const [newMemberRole, setNewMemberRole] =
    React.useState<MemberInvite["role"]>("member");

  const defaultValues: MonitorWorkspaceFormValues = {
    workspaceName: "",
    description: "",
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
          workspaceSchema.parse(value);
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
      <div className="space-y-2">
        <form.Field name="workspaceName">
          {(field) => (
            <>
              <Label htmlFor="workspaceName">Workspace Name</Label>
              <Input
                id="workspaceName"
                name="workspaceName"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                placeholder="My Monitor Workspace"
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
                <p className="text-sm text-destructive">
                  {field.state.meta.errors[0]}
                </p>
              )}
            </>
          )}
        </form.Field>
      </div>

      <Separator />

      <div className="space-y-4">
        <h2 className="text-lg font-medium">Invite Team Members</h2>
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
                      const validatedMember = memberInviteSchema.parse({
                        email: newMemberEmail,
                        role: newMemberRole,
                      });

                      if (
                        membersApi.state.value?.some(
                          (member: MemberInvite) =>
                            member.email === newMemberEmail,
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
                <div className="mt-4 rounded border p-2">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Pending Invitations
                  </h3>
                  {membersApi.state.value?.map(
                    (member: MemberInvite, index: number) => (
                      <div
                        key={`member-${index}`}
                        className="flex py-2 even:border-b even:border-dashed items-center justify-between gap-2 last:border-none"
                      >
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {member.email}
                          </span>
                          <span className="text-xs text-muted-foreground capitalize">
                            {member.role}
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-7 text-muted-foreground hover:text-destructive"
                          onClick={() => membersApi.removeValue(index)}
                          aria-label="Remove member"
                        >
                          <X className="size-4" />
                        </Button>
                      </div>
                    ),
                  )}
                </div>
              )}
              {membersApi.state.meta.errors &&
                typeof membersApi.state.meta.errors[0] === "string" && (
                  <p className="text-sm text-destructive">
                    {membersApi.state.meta.errors[0]}
                  </p>
                )}
            </>
          )}
        </form.Field>
      </div>

      <div className="flex justify-end space-x-4 pt-4">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>

        <form.Subscribe selector={(state) => [state.canSubmit, state.isDirty]}>
          {([canSubmit, isDirty]) => (
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || !canSubmit || !isDirty}
            >
              {isSubmitting ? "Creating..." : submitLabel}
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  );
}
