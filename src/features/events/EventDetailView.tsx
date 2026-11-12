"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, Check, Lock, LoaderCircle, MapPin, Pencil, Radio, Send, Shirt, Sparkles, Trash2, Unlock, Wallet } from "lucide-react";
import { ActionButton, Notice } from "@/components/ui/Controls";
import { Modal } from "@/components/ui/Modal";
import { Photo } from "@/components/ui/Photo";
import { useAuth } from "@/features/auth/AuthProvider";
import { useSocketEvent } from "@/features/app/socket";
import { chatApi } from "@/features/messages/api";
import type { ChatMessage } from "@/features/messages/types";
import { socialApi, type EventDetail, type PlanRow } from "@/features/social/api";
import { errorMessage, useLooks, useWardrobe } from "@/features/workspace/hooks";
import type { PlannedOutfit } from "@/features/workspace/api";
import { cn } from "@/lib/utils";
import { EventForm } from "./EventForm";
import { formatEventDate } from "./EventsView";

const COLOURS = [
  { name: "Red", hex: "#c62828" },
  { name: "Maroon", hex: "#6d1b2b" },
  { name: "Pink", hex: "#e785a8" },
  { name: "Peach", hex: "#f2b28f" },
  { name: "Orange", hex: "#e8722c" },
  { name: "Mustard", hex: "#d4a017" },
  { name: "Gold", hex: "#c9a14a" },
  { name: "Green", hex: "#2e7d32" },
  { name: "Emerald", hex: "#0f7b5f" },
  { name: "Teal", hex: "#1f7a80" },
  { name: "Blue", hex: "#2a6fd6" },
  { name: "Navy", hex: "#1c2957" },
  { name: "Purple", hex: "#6a3aa7" },
  { name: "Lavender", hex: "#b7a4e0" },
  { name: "White", hex: "#f7f5f0" },
  { name: "Ivory", hex: "#ece3cf" },
  { name: "Beige", hex: "#cdb899" },
  { name: "Grey", hex: "#8a8a8f" },
  { name: "Black", hex: "#141414" },
  { name: "Silver", hex: "#c0c4cc" },
];
const hexOf = (name: string | null) => COLOURS.find((c) => c.name === name)?.hex;

/** One event: every circle member's planned look, clash warnings, and the Get Ready With Me session (#10, #11). */
export function EventDetailView({ id }: { id: string }) {
  const { token } = useAuth();
  const router = useRouter();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [picking, setPicking] = useState<PlanRow | null>(null);
  const [suggestFor, setSuggestFor] = useState<PlanRow | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setEvent(await socialApi.event(token, id));
      setError("");
    } catch (e) {
      setError(errorMessage(e));
    }
  }, [token, id]);

  useEffect(() => {
    if (!token) return;
    socialApi
      .event(token, id)
      .then(setEvent)
      .catch((e) => setError(errorMessage(e)));
  }, [token, id]);

  // Live updates while people pick outfits.
  useSocketEvent<{ eventId: string }>("event:planUpdated", (p) => p.eventId === id && load());
  useSocketEvent<{ eventId: string }>("event:grwm", (p) => p.eventId === id && load());

  const setPlan = async (plan: PlanRow, body: Parameters<typeof socialApi.setPlan>[3]) => {
    if (!token) return;
    setBusy(plan.id);
    setError("");
    try {
      setEvent(await socialApi.setPlan(token, id, plan.id, body));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  const toggleGrwm = async () => {
    if (!token || !event) return;
    setBusy("grwm");
    try {
      await socialApi.setGrwm(token, id, !event.grwmLiveAt);
      await load();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  const remove = async () => {
    if (!token || !confirm("Delete this event for everyone?")) return;
    await socialApi.deleteEvent(token, id).catch((e) => setError(errorMessage(e)));
    router.push("/saved?tab=events");
  };

  if (!event) {
    return (
      <main className="mx-auto max-w-[1200px] px-4 py-10 sm:px-8">
        {error ? <Notice tone="error">{error}</Notice> : <LoaderCircle className="mx-auto size-6 animate-spin text-accent-bright" />}
      </main>
    );
  }

  const warnedPlans = new Set(event.warnings.flatMap((w) => w.planIds));

  return (
    <main className="mx-auto max-w-[1200px] px-4 py-8 sm:px-8 lg:py-12">
      <Link href="/saved?tab=events" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-white">
        <ArrowLeft className="size-4" />
        Events
      </Link>
      <header className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="chrome text-[2rem] font-medium leading-tight tracking-[-0.03em]">{event.title}</h1>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-subtle">
            <span>{formatEventDate(event.eventDate)}</span>
            {event.location && (
              <span className="flex items-center gap-1">
                <MapPin className="size-3.5" />
                {event.location}
              </span>
            )}
            {event.dressCode && <span>{event.dressCode}</span>}
            {event.budget ? (
              <span className="flex items-center gap-1">
                <Wallet className="size-3.5" />₹{event.budget.toLocaleString("en-IN")} each
              </span>
            ) : null}
          </div>
          {event.notes && <p className="mt-2 max-w-[640px] whitespace-pre-wrap text-sm text-muted">{event.notes}</p>}
        </div>
        {event.canManage && (
          <div className="flex gap-2 self-start">
            <ActionButton variant="ghost" className="h-9" onClick={() => setEditing(true)}>
              <Pencil className="size-4" />
              Edit
            </ActionButton>
            <ActionButton variant="danger" className="h-9" onClick={remove}>
              <Trash2 className="size-4" />
            </ActionButton>
          </div>
        )}
      </header>

      {error && (
        <div className="mt-4">
          <Notice tone="error">{error}</Notice>
        </div>
      )}
      {event.warnings.length > 0 && (
        <div className="mt-5 flex flex-col gap-2">
          {event.warnings.map((w) => (
            <p key={w.message} className="flex items-center gap-2 rounded-xl border border-amber-300/30 bg-amber-300/[0.07] px-3.5 py-2.5 text-sm text-amber-100">
              <AlertTriangle className="size-4 shrink-0" />
              {w.message}
            </p>
          ))}
        </div>
      )}

      <div className="mt-8 grid gap-8 xl:grid-cols-[1fr_380px]">
        <section className="grid content-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {event.plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              warned={warnedPlans.has(plan.id)}
              busy={busy === plan.id}
              onPick={() => setPicking(plan)}
              onSuggest={() => setSuggestFor(plan)}
              onColour={(color) => setPlan(plan, { color })}
              onLock={() => setPlan(plan, { status: plan.status === "LOCKED" ? "PLANNING" : "LOCKED" })}
            />
          ))}
        </section>

        <aside className="flex flex-col gap-4 xl:sticky xl:top-24 xl:h-fit">
          <div className="card-violet flex flex-col gap-3 rounded-(--radius-panel) p-5">
            <p className="flex items-center gap-2 text-body font-medium text-white">
              <Radio className={cn("size-4", event.grwmLiveAt ? "text-red-400" : "text-accent-bright")} />
              Get Ready With Me
            </p>
            <p className="text-sm text-muted">
              {event.grwmLiveAt ? "Live now — picks update for everyone as you change them." : "Start a live session so the circle picks outfits together and chats here."}
            </p>
            <ActionButton variant={event.grwmLiveAt ? "danger" : "primary"} loading={busy === "grwm"} onClick={toggleGrwm}>
              {event.grwmLiveAt ? "End session" : "Start GRWM session"}
            </ActionButton>
          </div>
          {event.groupId && <GrwmChat groupId={event.groupId} />}
        </aside>
      </div>

      <Modal open={editing} onClose={() => setEditing(false)} title="Edit event" className="sm:max-w-[600px]">
        {editing && (
          <EventForm
            initial={{ ...event, eventType: event.eventType ?? undefined, dressCode: event.dressCode ?? undefined, location: event.location ?? undefined, notes: event.notes ?? undefined }}
            submitLabel="Save changes"
            onSubmit={async (input) => {
              if (!token) return;
              setEvent(await socialApi.updateEvent(token, id, { ...input, circleId: undefined }));
              setEditing(false);
            }}
          />
        )}
      </Modal>

      <Modal open={Boolean(picking)} onClose={() => setPicking(null)} title={picking ? `Look for ${picking.person.isMe ? "you" : picking.person.name}` : ""} className="sm:max-w-[640px]">
        {picking && (
          <LookPicker
            current={picking.lookId}
            onPick={async (lookId) => {
              await setPlan(picking, { lookId });
              setPicking(null);
            }}
          />
        )}
      </Modal>

      <Modal open={Boolean(suggestFor)} onClose={() => setSuggestFor(null)} title="AI outfit ideas for this event" className="sm:max-w-[600px]">
        {suggestFor && <Suggestions eventId={id} planId={suggestFor.id} />}
      </Modal>
    </main>
  );
}

function PlanCard({
  plan,
  warned,
  busy,
  onPick,
  onSuggest,
  onColour,
  onLock,
}: {
  plan: PlanRow;
  warned: boolean;
  busy: boolean;
  onPick: () => void;
  onSuggest: () => void;
  onColour: (c: string | null) => void;
  onLock: () => void;
}) {
  const locked = plan.status === "LOCKED";
  const image = plan.look?.image ?? plan.person.twin ?? plan.person.avatar;
  return (
    <article className={cn("card-violet flex flex-col overflow-hidden rounded-(--radius-panel)", warned && "ring-1 ring-amber-300/60")}>
      <div className="relative aspect-[3/4] bg-white/[0.04]">
        {image ? <Photo src={image} alt={plan.person.name} className={plan.look ? undefined : "opacity-60"} /> : <div className="flex size-full items-center justify-center text-3xl text-muted">{plan.person.name.charAt(0)}</div>}
        {!plan.look && <span className="absolute inset-x-0 bottom-3 text-center text-xs text-white/80">No look picked yet</span>}
        <span className={cn("absolute left-2 top-2 flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium", locked ? "bg-green/90 text-canvas" : "bg-black/60 text-white")}>
          {locked ? <Lock className="size-3" /> : null}
          {locked ? "Locked in" : "Planning"}
        </span>
        {plan.color && (
          <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] text-white">
            <span className="size-2.5 rounded-full border border-white/40" style={{ background: hexOf(plan.color) ?? plan.color }} />
            {plan.color}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <p className="truncate text-sm font-medium text-white">
          {plan.person.isMe ? "You" : plan.person.name}
          {plan.look && <span className="font-normal text-muted"> · {plan.look.name}</span>}
        </p>
        {plan.canEdit ? (
          <>
            <select
              value={plan.color ?? ""}
              disabled={busy || locked}
              onChange={(e) => onColour(e.target.value || null)}
              aria-label="Main colour"
              className="h-8 rounded-lg border border-white/10 bg-white/[0.04] px-2 text-xs text-white [&>option]:bg-[#0b0b1e]"
            >
              <option value="">Main colour…</option>
              {COLOURS.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
            <div className="mt-auto flex flex-wrap gap-1.5">
              <button type="button" onClick={onPick} disabled={busy || locked} className="flex h-8 items-center gap-1 rounded-full bg-white/8 px-3 text-xs text-white hover:bg-white/12 disabled:opacity-50">
                <Shirt className="size-3.5" />
                {plan.look ? "Change" : "Pick look"}
              </button>
              {plan.person.isMe && (
                <button type="button" onClick={onSuggest} disabled={busy || locked} className="flex h-8 items-center gap-1 rounded-full bg-white/8 px-3 text-xs text-white hover:bg-white/12 disabled:opacity-50">
                  <Sparkles className="size-3.5" />
                  Ideas
                </button>
              )}
              <button
                type="button"
                onClick={onLock}
                disabled={busy || (!locked && !plan.lookId)}
                className="flex h-8 items-center gap-1 rounded-full bg-accent-bright px-3 text-xs text-white hover:brightness-110 disabled:opacity-40"
              >
                {busy ? <LoaderCircle className="size-3.5 animate-spin" /> : locked ? <Unlock className="size-3.5" /> : <Check className="size-3.5" />}
                {locked ? "Unlock" : "Lock in"}
              </button>
            </div>
          </>
        ) : (
          <p className="mt-auto text-xs text-muted">{plan.person.kind === "PROFILE" ? "Planned by the circle owner" : "They pick their own look"}</p>
        )}
      </div>
    </article>
  );
}

function LookPicker({ current, onPick }: { current: string | null; onPick: (lookId: string | null) => Promise<void> }) {
  const { items: looks, status } = useLooks();
  const [saving, setSaving] = useState<string | null>(null);
  if (status === "loading") return <LoaderCircle className="size-5 animate-spin text-accent-bright" />;
  if (!looks.length)
    return (
      <Notice>
        You have no saved looks yet.{" "}
        <Link href="/drape" className="text-accent-bright hover:text-white">
          Create one in Drape
        </Link>
        .
      </Notice>
    );
  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
      {looks.map((l) => (
        <button
          key={l.id}
          type="button"
          disabled={Boolean(saving)}
          onClick={async () => {
            setSaving(l.id);
            await onPick(l.id === current ? null : l.id);
          }}
          className={cn("overflow-hidden rounded-xl border text-left transition", l.id === current ? "border-accent-bright ring-2 ring-accent-bright/40" : "border-white/10 hover:border-white/30")}
        >
          <div className="relative aspect-[3/4] bg-white/[0.04]">
            <Photo src={l.image} alt={l.name} />
            {saving === l.id && (
              <span className="absolute inset-0 flex items-center justify-center bg-black/50">
                <LoaderCircle className="size-5 animate-spin text-white" />
              </span>
            )}
          </div>
          <p className="truncate px-2 py-1.5 text-xs text-white">{l.name}</p>
        </button>
      ))}
    </div>
  );
}

function Suggestions({ eventId, planId }: { eventId: string; planId: string }) {
  const { token } = useAuth();
  const wardrobe = useWardrobe();
  const [outfits, setOutfits] = useState<PlannedOutfit[] | null>(null);
  const [raw, setRaw] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    socialApi
      .suggestPlan(token, eventId, planId)
      .then((res) => {
        setOutfits(((res.outfits?.outfits ?? []) as PlannedOutfit[]) || []);
        setRaw(res.raw);
      })
      .catch((e) => setError(errorMessage(e)));
  }, [token, eventId, planId]);

  if (error) return <Notice tone="error">{error}</Notice>;
  if (!outfits)
    return (
      <p className="flex items-center gap-2 text-sm text-muted">
        <LoaderCircle className="size-4 animate-spin text-accent-bright" />
        Reading your wardrobe…
      </p>
    );
  if (!outfits.length) return <p className="whitespace-pre-wrap text-sm text-subtle">{raw}</p>;

  const byId = new Map(wardrobe.items.map((i) => [i.id, i]));
  return (
    <div className="flex flex-col gap-3">
      {outfits.map((o, i) => (
        <article key={i} className="rounded-xl border border-white/8 bg-white/[0.02] p-3">
          <p className="text-sm font-medium text-white">
            {o.name || `Option ${i + 1}`}
            {o.confidence != null && <span className="ml-2 text-xs text-accent-bright">{Math.round(o.confidence)}% match</span>}
          </p>
          <div className="mt-2 flex gap-1.5">
            {o.itemIds.map((id) => byId.get(id)).map((p) =>
              p ? (
                <Link key={p.id} href={`/drape?item=${p.id}`} title={p.name} className="aspect-square w-14 overflow-hidden rounded-lg bg-white/[0.05]">
                  <Photo src={p.image} alt={p.name} fit="contain" />
                </Link>
              ) : null
            )}
          </div>
          {o.why && <p className="mt-2 text-xs text-subtle">{o.why}</p>}
          {Array.isArray(o.missing) && o.missing.length > 0 && <p className="mt-1 text-xs text-amber-200">Missing: {o.missing.map((m) => m.item).join(", ")}</p>}
        </article>
      ))}
      <p className="text-xs text-muted">Drape a piece, save the look, then pick it for this event.</p>
    </div>
  );
}

/** The event's group chat, live (reuses the existing chat backend). */
function GrwmChat({ groupId }: { groupId: string }) {
  const { token, user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[] | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!token) return;
    chatApi
      .getGroupMessages(token, groupId, { take: 50 })
      .then((list) => setMessages([...list].sort((a, b) => a.sentAt.localeCompare(b.sentAt))))
      .catch(() => setMessages([]));
  }, [token, groupId]);

  useSocketEvent<ChatMessage & { groupId?: string }>("receiveMessage", (m) => {
    if (m.groupId !== groupId) return;
    setMessages((list) => (list?.some((x) => x.id === m.id) ? list : [...(list ?? []), m]));
  });

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !text.trim()) return;
    setSending(true);
    try {
      const m = await chatApi.sendMessage(token, { groupId, content: text.trim() });
      setMessages((list) => (list?.some((x) => x.id === m.id) ? list : [...(list ?? []), m]));
      setText("");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="card-violet flex h-[420px] flex-col rounded-(--radius-panel)">
      <p className="border-b border-white/8 px-4 py-3 text-sm font-medium text-white">Circle chat</p>
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {messages === null ? (
          <LoaderCircle className="size-4 animate-spin text-accent-bright" />
        ) : messages.length === 0 ? (
          <p className="text-sm text-muted">Say hi and share what you&apos;re thinking of wearing.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {messages.map((m) => {
              const mine = m.senderId === user?.id;
              return (
                <li key={m.id} className={cn("flex flex-col", mine ? "items-end" : "items-start")}>
                  {!mine && <span className="text-[10px] text-muted">{m.sender?.username || m.sender?.email?.split("@")[0]}</span>}
                  <span className={cn("max-w-[85%] rounded-2xl px-3 py-1.5 text-sm", mine ? "bg-accent-bright text-white" : "bg-white/8 text-white")}>
                    {m.attachmentUrl && m.attachmentType === "image" && (
                      <span className="mb-1 block w-40 overflow-hidden rounded-lg">
                        <Photo src={m.attachmentUrl} alt="" />
                      </span>
                    )}
                    {m.content}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
        <div ref={bottom} />
      </div>
      <form onSubmit={send} className="flex gap-2 border-t border-white/8 p-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={1000}
          placeholder="Message the circle…"
          aria-label="Message the circle"
          className="h-10 min-w-0 flex-1 rounded-full border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none focus:border-accent-bright/70"
        />
        <button type="submit" disabled={sending || !text.trim()} aria-label="Send" className="flex size-10 items-center justify-center rounded-full bg-accent-bright text-white disabled:opacity-50">
          {sending ? <LoaderCircle className="size-4 animate-spin" /> : <Send className="size-4" />}
        </button>
      </form>
    </div>
  );
}
