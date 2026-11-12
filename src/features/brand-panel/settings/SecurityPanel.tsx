"use client";

import { useState, type FormEvent } from "react";
import { ShieldCheck } from "lucide-react";
import { ActionButton, Field, Notice } from "@/components/ui/Controls";
import { useAuth } from "@/features/auth/AuthProvider";
import { brandApi } from "../api";
import { errorMessage } from "../useResource";

/** Change the password while signed in. Every device, including this one, is signed out afterwards. */
export function SecurityPanel({ onDone }: { onDone: () => void }) {
  const { token, logout } = useAuth();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [again, setAgain] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!current) return setError("Enter your current password.");
    if (next.length < 8) return setError("Your new password needs at least 8 characters.");
    if (next.length > 72) return setError("Your new password can be at most 72 characters.");
    if (next !== again) return setError("The two new passwords don't match.");
    setBusy(true);
    setError("");
    try {
      await brandApi.changePassword(token, current, next);
      onDone();
      logout();
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <p className="flex items-start gap-2 text-xs text-muted">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-accent-bright" aria-hidden />
        After you change it you&apos;ll be signed out everywhere and sign in again with the new password.
      </p>
      {error && <Notice tone="error">{error}</Notice>}
      <Field label="Current password" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
      <Field label="New password" type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} hint="8 to 72 characters." />
      <Field label="Repeat new password" type="password" autoComplete="new-password" value={again} onChange={(e) => setAgain(e.target.value)} />
      <ActionButton type="submit" loading={busy} className="w-full">
        Change password
      </ActionButton>
    </form>
  );
}
