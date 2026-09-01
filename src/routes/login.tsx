import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPasswordReset, signIn, signUp } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [{ title: "Sign in — MyEdge" }],
  }),
  component: LoginPage,
});

function LoginPage() {
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkInbox, setCheckInbox] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setCheckInbox(false);
    setBusy(true);
    try {
      if (mode === "signup") {
        const result = await signUp(email.trim(), password);
        if (!result.session) {
          setCheckInbox(true);
        }
        // If email confirmation is off, onAuthStateChange in AuthProvider picks up
        // the new session and the root guard redirects to /onboarding automatically.
      } else {
        await signIn(email.trim(), password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const submitForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await requestPasswordReset(email);
      setResetSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  };

  if (mode === "forgot") {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center px-4 py-10">
        <div className="text-center">
          <Sparkles className="mx-auto h-6 w-6 text-primary" aria-hidden="true" />
          <h1 className="mt-3 text-2xl font-semibold tracking-tight">Reset your password</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {resetSent
              ? "Check your email for a reset link."
              : "We'll email you a link to set a new password."}
          </p>
        </div>

        {resetSent ? (
          <p className="mt-8 text-center text-sm leading-relaxed text-muted-foreground">
            Didn&apos;t get it? Check spam, or{" "}
            <button
              type="button"
              onClick={() => setResetSent(false)}
              className="text-foreground underline"
            >
              try again
            </button>
            .
          </p>
        ) : (
          <form onSubmit={submitForgot} className="mt-8 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="forgot-email">Email</Label>
              <Input
                id="forgot-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            {error ? (
              <p role="alert" className="text-sm leading-relaxed text-destructive">
                {error}
              </p>
            ) : null}
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Sending…" : "Send reset link"}
            </Button>
          </form>
        )}

        <button
          type="button"
          onClick={() => {
            setMode("signin");
            setError(null);
            setResetSent(false);
          }}
          className="mt-6 text-center text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Back to sign in
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center px-4 py-10">
      <div className="text-center">
        <Sparkles className="mx-auto h-6 w-6 text-primary" aria-hidden="true" />
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">MyEdge</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === "signin" ? "Sign in to your daily briefing" : "Create your account"}
        </p>
      </div>

      <form onSubmit={submit} className="mt-8 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
          />
          {mode === "signin" ? (
            <button
              type="button"
              onClick={() => {
                setMode("forgot");
                setError(null);
              }}
              className="text-xs text-muted-foreground underline transition-colors hover:text-foreground"
            >
              Forgot password?
            </button>
          ) : null}
        </div>

        {error ? (
          <p role="alert" className="text-sm leading-relaxed text-destructive">
            {error}
          </p>
        ) : null}
        {checkInbox ? (
          <p role="status" className="text-sm leading-relaxed text-muted-foreground">
            Account created — check your email to confirm it, then sign in.
          </p>
        ) : null}

        <Button type="submit" className="w-full" disabled={busy}>
          {mode === "signin" ? "Sign in" : "Create account"}
        </Button>
      </form>

      <button
        type="button"
        onClick={() => {
          setMode(mode === "signin" ? "signup" : "signin");
          setError(null);
          setCheckInbox(false);
        }}
        className="mt-6 text-center text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        {mode === "signin" ? "New here? Create an account" : "Already have an account? Sign in"}
      </button>
    </main>
  );
}
