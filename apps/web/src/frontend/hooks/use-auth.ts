import { AuthContext } from "@/frontend/lib/context/auth-context";
import { useContext } from "react";

export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return {
    user: context.user,
    session: context.session,
    isAuthenticated: context.isAuthenticated,
    isLoading: context.isLoading,
  };
}
