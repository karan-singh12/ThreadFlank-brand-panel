"use client";

import { useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Handshake, Mail, ShieldCheck, Send, ExternalLink, type LucideIcon } from "lucide-react";
import { ActionButton, Field, Notice, SelectField, TextArea } from "@/components/ui/Controls";
import { useAuth } from "@/features/auth/AuthProvider";
import { apiRequest, ApiError } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/config";
import { contactContent as copy, SUPPORT_EMAIL } from "@/data/site-content";

const CHANNEL_ICONS: Record<string, LucideIcon> = { email: Mail, brands: Handshake, privacy: ShieldCheck };

/** Remounts once the session resolves so name and email prefill for signed-in visitors. */
export function ContactView() {
  const { user } = useAuth();
  return <ContactForm key={user?.id ?? "guest"} />;
}

function ContactForm() {
  const { user } = useAuth();
  const params = useSearchParams();
  const initialTopic = copy.topics.some((t) => t.value === params.get("topic")) ? params.get("topic")! : copy.topics[0].value;
  const plan = params.get("plan");

  const [name, setName] = useState(user?.username ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [topic, setTopic] = useState(initialTopic);
  const [message, setMessage] = useState(plan ? `I'm interested in the ${plan} plan.` : "");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await apiRequest(ENDPOINTS.contact, {
        method: "POST",
        body: {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          topic,
          message: message.trim(),
          userId: user?.id,
        },
      });

      setSubmitted(true);
      setMessage("");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Could not submit your message right now. You can also email us directly.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const openMailto = () => {
    const topicLabel = copy.topics.find((t) => t.value === topic)?.label ?? topic;
    const body = `${message}\n\n— ${name} (${email})`;
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(topicLabel)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <main className="mx-auto grid max-w-[1080px] gap-10 px-4 py-12 sm:px-8 lg:grid-cols-[1fr_360px] lg:py-16">
      <section>
        <h1 className="chrome text-h2 font-medium">{copy.title}</h1>
        <p className="mt-3 max-w-[520px] text-body text-subtle">{copy.description}</p>

        {submitted ? (
          <div className="card-violet mt-8 flex flex-col items-start gap-4 rounded-(--radius-panel) p-8">
            <div className="flex items-center gap-3 text-accent-bright">
              <CheckCircle2 className="size-8" />
              <h2 className="text-xl font-medium text-white">Message received!</h2>
            </div>
            <p className="text-body text-subtle">
              Thank you for reaching out. Your message has been routed to our team and we will respond to{" "}
              <span className="text-white font-medium">{email}</span> within one working day.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <ActionButton variant="ghost" onClick={() => setSubmitted(false)}>
                Send another message
              </ActionButton>
              <button
                type="button"
                onClick={openMailto}
                className="flex items-center gap-1.5 text-xs text-muted hover:text-white transition-colors"
              >
                <span>Open in email client</span>
                <ExternalLink className="size-3" />
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="card-violet mt-8 flex flex-col gap-5 rounded-(--radius-panel) p-6">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label={copy.name} required value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
              <Field label={copy.email} required type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            </div>
            <SelectField label={copy.topic} value={topic} onChange={(e) => setTopic(e.target.value)} options={copy.topics} />
            <TextArea
              label={copy.message}
              required
              rows={6}
              minLength={10}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={copy.messagePlaceholder}
            />

            {error && (
              <Notice tone="error">
                {error}{" "}
                <button type="button" onClick={openMailto} className="underline hover:text-white">
                  Email directly instead
                </button>
              </Notice>
            )}

            <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
              <ActionButton type="submit" loading={submitting} className="self-start">
                <Send className="size-4" />
                {copy.submit}
              </ActionButton>

              <button
                type="button"
                onClick={openMailto}
                className="text-xs text-muted hover:text-white transition-colors underline"
              >
                Or compose in your email client
              </button>
            </div>
          </form>
        )}
      </section>

      <aside className="flex flex-col gap-4 lg:pt-[120px]">
        {copy.channels.map((c) => {
          const Icon = CHANNEL_ICONS[c.id];
          return (
            <div key={c.id} className="card-violet flex gap-4 rounded-(--radius-card) p-5">
              <span className="keycap flex size-10 shrink-0 items-center justify-center rounded-xl">
                <Icon className="size-5 text-accent-bright" strokeWidth={1.75} />
              </span>
              <div className="min-w-0">
                <p className="text-body font-medium text-white">{c.title}</p>
                <p className="text-sm text-muted">{c.body}</p>
                <p className="mt-1 truncate text-sm text-subtle">{c.value}</p>
              </div>
            </div>
          );
        })}
      </aside>
    </main>
  );
}
