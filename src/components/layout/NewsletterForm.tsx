"use client";

import { useState, type FormEvent } from "react";
import { CheckCircle2, LoaderCircle } from "lucide-react";
import { ApiError, apiRequest } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/config";
import { footer } from "@/data/landing-page";

/**
 * Sign-ups go through the public contact endpoint with topic "newsletter",
 * so they show up in the admin panel's contact inbox until a mailing list exists.
 */
export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState("");
  const copy = footer.newsletter;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setState("sending");
    const address = email.trim().toLowerCase();
    const local = address.split("@")[0] ?? "";
    try {
      await apiRequest(ENDPOINTS.contact, {
        method: "POST",
        body: {
          name: local.length >= 2 ? local.slice(0, 100) : "Subscriber",
          email: address,
          topic: "newsletter",
          message: "Newsletter sign-up from the landing page.",
        },
      });
      setState("done");
    } catch (err) {
      setState("idle");
      setError(err instanceof ApiError && err.status === 400 ? "Please enter a valid email address." : err instanceof ApiError ? err.message : "Couldn't subscribe right now. Please try again.");
    }
  };

  if (state === "done") {
    return (
      <p role="status" className="flex items-center gap-2 text-body text-green">
        <CheckCircle2 className="size-5" />
        {copy.success}
      </p>
    );
  }

  return (
    <form className="flex flex-col" onSubmit={submit}>
      <label htmlFor="newsletter-email" className="text-body text-subtle">
        {copy.label}
      </label>
      <div className="mt-3 flex gap-[11px]">
        <input
          id="newsletter-email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={copy.placeholder}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "newsletter-error" : undefined}
          className="h-[52px] min-w-0 flex-1 rounded-full bg-white/6 px-4 text-body text-white placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent"
        />
        <button
          type="submit"
          disabled={state === "sending"}
          className="flex h-[52px] shrink-0 items-center gap-2 rounded-full bg-accent px-[18px] text-body font-medium text-white transition-colors hover:bg-accent-bright disabled:opacity-70"
        >
          {state === "sending" && <LoaderCircle className="size-4 animate-spin" />}
          {copy.button}
        </button>
      </div>
      {error && (
        <p id="newsletter-error" role="alert" className="mt-2 text-sm text-red-400">
          {error}
        </p>
      )}
    </form>
  );
}
