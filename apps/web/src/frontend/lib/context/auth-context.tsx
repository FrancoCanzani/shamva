import supabase from "@/frontend/lib/supabase";
import { AuthContextType } from "@/frontend/types/types";
import type { Session, User } from "@supabase/supabase-js";
import { redirect } from "@tanstack/react-router";
import React, { createContext, useEffect, useState } from "react";
import { router } from "../../main";

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
        const { data: claimsData, error: claimsError } =
          await supabase.auth.getClaims();

        console.log(claimsData);

        if (claimsError) {
          console.error("Error getting claims:", claimsError);
          setUser(null);
          setSession(null);
          redirect({ to: "/" });
          return;
        }
        if (claimsData?.claims) {
          const {
            data: { session },
            error: sessionError,
          } = await supabase.auth.getSession();
          if (sessionError) {
            console.error("Error getting session:", sessionError);
            setUser(null);
            setSession(null);
            redirect({ to: "/" });
            return;
          }
          setSession(session);
          setUser(session?.user ?? null);
        } else {
          setUser(null);
          setSession(null);
        }
      } catch (error) {
        console.error("Error in getInitialAuth:", error);
        setUser(null);
        setSession(null);
        redirect({ to: "/" });
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
      
      router.invalidate();
      setIsLoading(false);

      switch (event) {
        case "SIGNED_OUT":
          redirect({ to: "/" });
          break;
        case "SIGNED_IN":
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

  const signOut = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
    } catch (error) {
      setUser(null);
      setSession(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    session,
    isLoading,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
