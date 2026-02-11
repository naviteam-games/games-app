"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { createClient } from "@/infrastructure/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { isAnonymousUser } from "@/lib/auth-utils";

interface AuthContextType {
  user: SupabaseUser | null;
  loading: boolean;
  isAnonymous: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAnonymous: false,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    router.push("/login");
  }, [supabase.auth, router]);

  return (
    <AuthContext.Provider value={{ user, loading, isAnonymous: isAnonymousUser(user), signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
