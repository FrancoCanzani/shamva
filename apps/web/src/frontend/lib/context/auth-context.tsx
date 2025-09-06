import supabase from "@/frontend/lib/supabase";
import { AuthContextType } from "@/frontend/lib/types";
import type { Session, User } from "@supabase/supabase-js";
import { redirect } from "@tanstack/react-router";
import React, { createContext, useEffect, useState } from "react";

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getInitialAuth = async () => {
      try {
        const { data: claimsData } = await supabase.auth.getClaims();

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("Error getting session:", sessionError);
          setUser(null);
          setSession(null);
        } else {
          setSession(session);

          const isAuthenticated = claimsData?.claims?.aud === "authenticated";

          if (isAuthenticated && session?.user) {
            setUser(session.user);
          } else {
            setUser(null);
          }
        }
      } catch (error) {
        console.error("Error in getInitialAuth:", error);
        setUser(null);
        setSession(null);
      } finally {
        setIsLoading(false);
      }
    };

    getInitialAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      switch (event) {
        case "SIGNED_OUT":
          redirect({ to: "/" });
          break;
        case "SIGNED_IN":
          redirect({ to: "/" });
          break;
        case "TOKEN_REFRESHED":
          break;
        case "USER_UPDATED":
          break;
        case "PASSWORD_RECOVERY":
          break;
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const value = {
    user,
    session,
    isLoading,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
