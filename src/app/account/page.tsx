"use client";

import { useState } from "react";
import { useData } from "@/components/DataProvider";
import { CloudIcon } from "@/components/icons";
import { Loading, Notice } from "@/components/ui";
import { supabase } from "@/lib/supabase";

export default function AccountPage() {
  const { ready, cloudEnabled, user, decks, cards, guestCards, importGuestData, signOut } = useData();

  if (!ready) return <Loading />;

  if (!cloudEnabled) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">Account</h1>
        <Notice>
          Sync isn&apos;t configured, so your cards are stored in this browser only. Add Supabase keys to{" "}
          <code className="text-fg">.env.local</code> to enable accounts — see the README.
        </Notice>
      </div>
    );
  }

  if (!user) return <AuthForm />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Account</h1>
      <div className="panel flex items-center gap-4 p-4">
        <span className="grid size-10 place-items-center rounded-full bg-soft text-muted">
          <CloudIcon />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{user.email}</p>
          <p className="text-sm text-muted">
            {decks.length} deck{decks.length === 1 ? "" : "s"} · {cards.length} card{cards.length === 1 ? "" : "s"} synced
          </p>
        </div>
      </div>

      {guestCards > 0 && <ImportGuest count={guestCards} onImport={importGuestData} />}

      <button className="btn btn-outline w-full sm:w-auto" onClick={signOut}>
        Sign out
      </button>
    </div>
  );
}

function ImportGuest({ count, onImport }: { count: number; onImport: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  return (
    <Notice
      action={
        <button
          className="btn btn-primary h-9 text-sm"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            await onImport();
            setBusy(false);
          }}
        >
          {busy ? "Importing…" : "Import"}
        </button>
      }
    >
      This device has {count} card{count === 1 ? "" : "s"} from before you signed in. Import them into your account?
    </Notice>
  );
}

function AuthForm() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setError(null);
    setInfo(null);
    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) setError(error.message);
      else if (!data.session) setInfo("Check your email to confirm your account, then sign in.");
    }
    setBusy(false);
  }

  return (
    <div className="mx-auto max-w-sm space-y-6 pt-4">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">{mode === "signin" ? "Welcome back" : "Create account"}</h1>
        <p className="text-sm text-muted">Sync your decks across all your devices.</p>
      </div>

      <form onSubmit={submit} className="space-y-3">
        <input
          className="input"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="input"
          type="password"
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
          placeholder="Password"
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="text-sm text-again">{error}</p>}
        {info && <p className="text-sm text-good">{info}</p>}
        <button className="btn btn-primary w-full" disabled={busy}>
          {busy ? "…" : mode === "signin" ? "Sign in" : "Create account"}
        </button>
      </form>

      <p className="text-center text-sm text-muted">
        {mode === "signin" ? "New here?" : "Already have an account?"}{" "}
        <button
          className="font-medium text-fg"
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setError(null);
            setInfo(null);
          }}
        >
          {mode === "signin" ? "Create an account" : "Sign in"}
        </button>
      </p>
      <p className="text-center text-xs text-muted">Without an account, cards are kept on this device.</p>
    </div>
  );
}
