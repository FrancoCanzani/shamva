import { queryClient } from "@/frontend/lib/query-client";
import { ProfileFormValues } from "@/frontend/lib/types";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { updateProfile } from "./profile";

export function useUpdateProfile() {
  return useMutation({
    mutationFn: (data: ProfileFormValues) => updateProfile(data),
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(["profile"], updatedProfile);

      queryClient.invalidateQueries({ queryKey: ["profile"] });

      toast.success("Profile updated successfully");
    },
    onError: (error: Error) => {
      console.error("Error updating profile:", error);
      toast.error(error.message || "Failed to update profile");
    },
  });
}
