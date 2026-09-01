import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";

// Broad on purpose — covers many walks of career and life. Each person picks up
// to MAX_FOCUS_TOPICS of these; News reorders itself around whichever ones overlap
// with its own five categories (Healthcare, Technology, Business, Venture Capital,
// Global Affairs — kept verbatim below so that matching still works).
export const FOCUS_TOPICS = [
  "Healthcare",
  "Technology",
  "Business",
  "Venture Capital",
  "Global Affairs",
  "Finance & Investing",
  "Law & Policy",
  "Education",
  "Marketing & Sales",
  "Science & Research",
  "Engineering",
  "Design & Creative Arts",
  "Media & Entertainment",
  "Sports & Fitness",
  "Travel & Hospitality",
  "Food & Culinary",
  "Real Estate & Construction",
  "Manufacturing & Industry",
  "Retail & E-commerce",
  "Agriculture & Environment",
  "Energy & Sustainability",
  "Government & Public Service",
  "Nonprofit & Social Impact",
  "Parenting & Family",
  "Personal Development & Wellness",
  "Fashion & Beauty",
  "Automotive & Transportation",
  "Music & Arts",
] as const;

export const MAX_FOCUS_TOPICS = 5;

export const AGE_RANGES = ["18-24", "25-34", "35-44", "45-54", "55-64", "65+"] as const;

export const GENDER_OPTIONS = ["Woman", "Man", "Non-binary", "Prefer not to say"] as const;

export type UserProfile = {
  id: string;
  email: string;
  is_admin: boolean;
  onboarded: boolean;
  focus_topics: string[];
  name: string | null;
  age_range: string | null;
  gender: string | null;
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

/** Emails a reset link that lands on /reset-password with a temporary recovery session. */
export async function requestPasswordReset(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  if (error) throw error;
}

/** Sets a new password for whoever the current session belongs to — used on the
 * /reset-password page, where landing via the emailed link establishes a temporary
 * recovery session for exactly this purpose. */
export async function updatePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

export async function fetchMyProfile(): Promise<UserProfile | null> {
  const { data: sessionData } = await supabase.auth.getSession();
  const uid = sessionData.session?.user.id;
  if (!uid) return null;
  // Explicit filter, not just RLS: an admin's SELECT policy can see every row in this
  // table (for the Load Today / Subscribers flows), so without this an admin's own
  // profile fetch can legitimately return more than one row once other people have
  // signed up — and .maybeSingle() throws on anything but exactly 0 or 1 row.
  const { data, error } = await supabase
    .from("user_profiles")
    .select("id, email, is_admin, onboarded, focus_topics, name, age_range, gender")
    .eq("id", uid)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function saveOnboarding(input: {
  name: string;
  ageRange: string;
  gender: string;
  focusTopics: string[];
}) {
  const { data: sessionData } = await supabase.auth.getSession();
  const uid = sessionData.session?.user.id;
  if (!uid) throw new Error("Not signed in.");
  const { error } = await supabase
    .from("user_profiles")
    .update({
      name: input.name.trim() || null,
      age_range: input.ageRange || null,
      gender: input.gender || null,
      focus_topics: input.focusTopics.slice(0, MAX_FOCUS_TOPICS),
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
