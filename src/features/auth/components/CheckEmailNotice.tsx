"use client";

import { useState } from "react";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import { FormAlert } from "@/components/forms/FormAlert";
import { authContent } from "@/data/auth-content";
import { authApi } from "../api";
import { applyServerErrors } from "../errors";
import { AuthHeader } from "./AuthHeader";

const copy = authContent.checkEmail;

/** Shown after signup: asks the user to open the emailed link, with a resend button. */
export function CheckEmailNotice({ email }: { email: string }) {
  const [busy, setBusy] = useState(false);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [before, after] = copy.description.split("{email}");

  const resend = async () => {
    setBusy(true);
    setError(null);
    try {
      await authApi.resendVerification({ email });
      setResent(true);
    } catch (e) {
      setError(applyServerErrors(e, () => undefined, []) || null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div role="status">
      <span className="mb-6 flex size-14 items-center justify-center rounded-2xl bg-accent/15 text-accent-bright ring-1 ring-accent/30">
        <MailCheck className="size-7" strokeWidth={1.5} />
      </span>
      <AuthHeader
        title={copy.title}
        description={
          <>
            {before}
            <span className="text-white">{email}</span>
            {after}
          </>
        }
      />
      <div className="flex flex-col gap-4">
        <p className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-subtle">{copy.reviewNote}</p>
        {resent && <FormAlert tone="success">{copy.resent}</FormAlert>}
        {error && <FormAlert>{error}</FormAlert>}
        <button
          type="button"
          onClick={resend}
          disabled={busy}
          className="glass-pill h-[52px] w-full rounded-full text-body text-white transition hover:brightness-125 disabled:opacity-60"
        >
          {busy ? copy.resending : copy.resend}
        </button>
      </div>
      <Link href="/login" className="mt-8 block text-center text-sm text-muted transition-colors hover:text-white">
        {copy.back}
      </Link>
    </div>
  );
}
