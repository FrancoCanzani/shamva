import { supabase } from "@/frontend/lib/supabase";
import type { Session, User } from "@supabase/supabase-js";
import { redirect } from "@tanstack/react-router";
import React, { createContext, useContext, useEffect, useState } from "react";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    supabase.auth.getClaims().then(({ data: claimsObj }) => {
      const claims = claimsObj?.claims;
      if (claims) {
        setUser({
          id: claims.sub,
          aud: Array.isArray(claims.aud) ? claims.aud[0] : claims.aud,
          role: claims.role,
          email: claims.email,
          phone: claims.phone,
          app_metadata: claims.app_metadata || {},
          user_metadata: claims.user_metadata || {},
          created_at: claims.iat
            ? new Date(claims.iat * 1000).toISOString()
            : "",
          updated_at: claims.exp
            ? new Date(claims.exp * 1000).toISOString()
            : "",
          is_anonymous: claims.is_anonymous,
          email_confirmed_at: undefined,
          phone_confirmed_at: undefined,
          confirmed_at: undefined,
          last_sign_in_at: undefined,
          identities: [],
        });
        setSession(null);
      } else {
        setUser(null);
        setSession(null);
      }
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);

      // Redirect to origin when user signs out
      if (event === "SIGNED_OUT") {
        redirect({ to: "/" });
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    // State updates will happen via onAuthStateChange listener
  };

  const value = {
    user,
    session,
    isLoading,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
