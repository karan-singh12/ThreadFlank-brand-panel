"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CircleAlert, CircleCheck, Loader2 } from "lucide-react";
import { authContent } from "@/data/auth-content";
import { authApi } from "../api";
import { AuthHeader } from "./AuthHeader";

const copy = authContent.verifyEmail;

type State = "verifying" | "done" | "invalid";

/** Landing page for the emailed /verify-email/<token> link. */
export function VerifyEmailView({ token }: { token: string }) {
  const [state, setState] = useState<State>("verifying");
  // The token is single-use, so React strict mode's second effect run must not call it again.
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    authApi.verifyEmail({ token }).then(
      () => setState("done"),
      () => setState("invalid")
    );
  }, [token]);

  const button = "glass-pill flex h-[52px] w-full items-center justify-center rounded-full text-body text-white transition hover:brightness-125";

  return (
    <div role="status">
      <span className="mb-6 flex size-14 items-center justify-center rounded-2xl bg-accent/15 text-accent-bright ring-1 ring-accent/30">
        {state === "verifying" && <Loader2 className="size-7 animate-spin" strokeWidth={1.5} />}
        {state === "done" && <CircleCheck className="size-7" strokeWidth={1.5} />}
        {state === "invalid" && <CircleAlert className="size-7" strokeWidth={1.5} />}
      </span>
      {state === "verifying" && <AuthHeader title={copy.verifyingTitle} />}
      {state === "done" && (
        <>
          <AuthHeader title={copy.successTitle} description={copy.successDescription} />
          <Link href="/login" className={button}>
            {copy.successAction}
          </Link>
        </>
      )}
      {state === "invalid" && (
        <>
          <AuthHeader title={copy.invalidTitle} description={copy.invalidDescription} />
          <Link href="/login" className={button}>
            {copy.invalidAction}
          </Link>
        </>
      )}
    </div>
  );
}
