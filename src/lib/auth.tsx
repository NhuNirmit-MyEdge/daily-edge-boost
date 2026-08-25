import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";

export const FOCUS_TOPICS = [
  "Healthcare",
  "Technology",
  "Business",
  "Venture Capital",
  "Global Affairs",
  "Digital Health",
  "Fintech",
  "AI & Machine Learning",
] as const;

export const EXPERIENCE_LEVELS = ["New to this", "Some experience", "Experienced"] as const;

export type UserProfile = {
  id: string;
  email: string;
  is_admin: boolean;
  onboarded: boolean;
  focus_topics: string[];
  experience_level: string | null;
  role_title: string | null;
};

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function fetchMyProfile(): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from("user_profiles")
    .select("id, email, is_admin, onboarded, focus_topics, experience_level, role_title")
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function saveOnboarding(input: {
  focusTopics: string[];
  experienceLevel: string;
  roleTitle: string;
}) {
  const { data: sessionData } = await supabase.auth.getSession();
  const uid = sessionData.session?.user.id;
  if (!uid) throw new Error("Not signed in.");
  const { error } = await supabase
    .from("user_profiles")
    .update({
      focus_topics: input.focusTopics,
      experience_level: input.experienceLevel,
      role_title: input.roleTitle || null,
      onboarded: true,
    })
    .eq("id", uid);
  if (error) throw error;
}

type AuthState = {
  loading: boolean;
  session: Session | null;
  profile: UserProfile | null;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthState>({
  loading: true,
  session: null,
  profile: null,
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const refreshProfile = async () => {
    try {
      setProfile(await fetchMyProfile());
    } catch (err) {
      console.error("[auth] couldn't load profile:", err);
    }
  };

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(async ({ data }: { data: { session: Session | null } }) => {
      if (!active) return;
      setSession(data.session);
      if (data.session) await refreshProfile();
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, nextSession: Session | null) => {
      setSession(nextSession);
      if (nextSession) {
        void refreshProfile();
      } else {
        setProfile(null);
      }
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthContext.Provider value={{ loading, session, profile, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  return useContext(AuthContext);
}
