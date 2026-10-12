"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useData } from "@/components/DataProvider";
import { BackLink, Loading, Notice } from "@/components/ui";
import { supabase } from "@/lib/supabase";

/** Landing page for password-reset emails; also used to change the password while signed in. */
export default function ResetPasswordPage() {
  const { ready, user } = useData();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linkError, setLinkError] = useState<string | null>(null);

  // Expired or already-used links come back with the reason in the URL hash.
  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.slice(1));
    const description = params.get("error_description");
    if (description) setLinkError(description.replace(/\+/g, " "));
  }, []);

  if (!ready) return <Loading />;

  if (!user) {
    return (
      <div className="mx-auto max-w-sm space-y-4 pt-4">
        <h1 className="text-2xl font-semibold tracking-tight">Reset password</h1>
        <Notice
          action={
            <Link href="/account" className="btn btn-primary h-9 text-sm">
              Back to sign in
            </Link>
          }
        >
          {linkError ?? "This reset link is invalid or has expired."} Request a new one from the sign-in page.
        </Notice>
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) setError(error.message);
    else router.replace("/account");
  }

  return (
    <div className="mx-auto max-w-sm space-y-6 pt-4">
      <BackLink href="/account" label="Account" />
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Choose a new password</h1>
        <p className="text-sm text-muted">For {user.email}</p>
      </div>

      <form onSubmit={submit} className="space-y-3">
        <input
          className="input"
          type="password"
          autoComplete="new-password"
          placeholder="New password"
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <input
          className="input"
          type="password"
          autoComplete="new-password"
          placeholder="Confirm new password"
          minLength={6}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />
        {error && <p className="text-sm text-again">{error}</p>}
        <button className="btn btn-primary w-full" disabled={busy}>
          {busy ? "…" : "Update password"}
        </button>
      </form>
    </div>
  );
}
