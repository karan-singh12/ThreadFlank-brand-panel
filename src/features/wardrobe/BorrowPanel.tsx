"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeftRight, Check, Hand, LoaderCircle, Undo2, X } from "lucide-react";
import { ActionButton, Field, Notice, Segmented, SelectField, TextArea } from "@/components/ui/Controls";
import { Modal } from "@/components/ui/Modal";
import { Photo } from "@/components/ui/Photo";
import { useAuth } from "@/features/auth/AuthProvider";
import { nameOf, socialApi, type BorrowRow, type CircleWardrobeItem } from "@/features/social/api";
import type { WardrobeItem } from "@/features/workspace/api";
import { errorMessage, useCircle } from "@/features/workspace/hooks";
import { cn } from "@/lib/utils";

type Person = { userId: string; name: string; avatar?: string | null };

const STATUS_STYLE: Record<BorrowRow["status"], string> = {
  PENDING: "bg-amber-400/15 text-amber-200",
  ACCEPTED: "bg-green/15 text-green",
  DECLINED: "bg-red-500/15 text-red-300",
  RETURNED: "bg-white/10 text-subtle",
  CANCELLED: "bg-white/10 text-muted",
};

/** Browse circle members' wardrobes and borrow or swap pieces (feature #8). */
export function BorrowPanel({ initialMember, myItems }: { initialMember: string | null; myItems: WardrobeItem[] }) {
  const { token } = useAuth();
  const circle = useCircle();
  const [chosen, setMember] = useState<string | null>(initialMember);
  // Wardrobe results are tagged with whose they are, so switching people shows a spinner.
  const [loaded, setLoaded] = useState<{ member: string; items: CircleWardrobeItem[]; error: string } | null>(null);
  const [requests, setRequests] = useState<{ incoming: BorrowRow[]; outgoing: BorrowRow[] } | null>(null);
  const [asking, setAsking] = useState<CircleWardrobeItem | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  // Account holders you share a circle with: your linked members + owners of circles you've joined.
  const people = useMemo<Person[]>(() => {
    const linked = circle.members.filter((m) => m.kind === "USER" && m.status === "ACTIVE" && m.userId).map((m) => ({ userId: m.userId!, name: m.name, avatar: m.photo }));
    const owners = circle.memberships.filter((m) => m.status === "ACTIVE" && m.owner).map((m) => ({ userId: m.owner!.id, name: nameOf(m.owner), avatar: m.owner!.avatar }));
    const seen = new Set<string>();
    return [...linked, ...owners].filter((p) => (seen.has(p.userId) ? false : (seen.add(p.userId), true)));
  }, [circle.members, circle.memberships]);

  const loadRequests = useCallback(() => {
    if (!token) return;
    socialApi
      .borrows(token)
      .then(setRequests)
      .catch(() => setRequests({ incoming: [], outgoing: [] }));
  }, [token]);

  useEffect(() => {
    if (!token) return;
    socialApi
      .borrows(token)
      .then(setRequests)
      .catch(() => setRequests({ incoming: [], outgoing: [] }));
  }, [token]);

  const member = chosen ?? people[0]?.userId ?? null;

  useEffect(() => {
    if (!token || !member) return;
    socialApi
      .memberWardrobe(token, member)
      .then((items) => setLoaded({ member, items, error: "" }))
      .catch((e) => setLoaded({ member, items: [], error: errorMessage(e) }));
  }, [token, member]);

  const current = loaded && loaded.member === member ? loaded : null;
  const items = current?.items ?? null;
  const itemsError = current?.error ?? "";

  const act = async (id: string, action: "accept" | "decline" | "returned" | "cancel") => {
    if (!token) return;
    setBusy(id);
    setError("");
    try {
      await socialApi.borrowAction(token, id, action);
      loadRequests();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="grid gap-10 xl:grid-cols-[1fr_380px]">
      <section className="min-w-0">
        <h2 className="text-title font-medium text-white">Circle wardrobes</h2>
        <p className="mt-1 text-sm text-muted">Borrow for an event, or offer a swap, from people in your Twin Circle.</p>
        {circle.loading ? (
          <LoaderCircle className="mt-6 size-6 animate-spin text-accent-bright" />
        ) : people.length === 0 ? (
          <div className="mt-6">
            <Notice>
              Link a friend&apos;s account to your circle to share wardrobes.{" "}
              <Link href="/profile?tab=circle" className="text-accent-bright hover:text-white">
                Invite from your Twin Circle
              </Link>
            </Notice>
          </div>
        ) : (
          <>
            <div className="no-scrollbar mt-5 flex gap-3 overflow-x-auto">
              {people.map((p) => (
                <button key={p.userId} type="button" onClick={() => setMember(p.userId)} aria-pressed={member === p.userId} className="flex w-16 shrink-0 flex-col items-center gap-1.5">
                  <span className={cn("flex size-14 items-center justify-center overflow-hidden rounded-full bg-white/[0.06] text-lg text-white ring-offset-2 ring-offset-[#0d0c22]", member === p.userId ? "ring-2 ring-accent-bright" : "opacity-70")}>
                    {p.avatar ? <Photo src={p.avatar} alt="" /> : p.name.charAt(0).toUpperCase()}
                  </span>
                  <span className={cn("w-full truncate text-center text-xs", member === p.userId ? "text-white" : "text-muted")}>{p.name}</span>
                </button>
              ))}
            </div>
            {itemsError && (
              <div className="mt-4">
                <Notice tone="error">{itemsError}</Notice>
              </div>
            )}
            {items === null ? (
              <LoaderCircle className="mt-6 size-6 animate-spin text-accent-bright" />
            ) : items.length === 0 && !itemsError ? (
              <p className="mt-6 text-sm text-muted">Their wardrobe is empty.</p>
            ) : (
              <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {items.map((i) => (
                  <article key={i.id} className="overflow-hidden rounded-(--radius-card) border border-white/8 bg-white/[0.02]">
                    <div className="relative aspect-[3/4] bg-white/[0.05]">
                      <Photo src={i.image} alt={i.name} fit="contain" />
                      {i.onLoan && <span className="absolute left-2 top-2 rounded-full bg-black/70 px-2 py-0.5 text-[10px] text-white">On loan</span>}
                    </div>
                    <div className="p-3">
                      <p className="truncate text-sm text-white">{i.name}</p>
                      <p className="truncate text-xs text-muted">{[i.brand, i.category].filter(Boolean).join(" · ")}</p>
                      <button
                        type="button"
                        onClick={() => setAsking(i)}
                        className="mt-2 flex h-8 w-full items-center justify-center gap-1.5 rounded-full bg-white/8 text-xs text-white hover:bg-white/12"
                      >
                        <Hand className="size-3.5" />
                        Ask to borrow
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </>
        )}
      </section>

      <aside className="flex flex-col gap-6">
        {error && <Notice tone="error">{error}</Notice>}
        <RequestList
          title="Requests for your items"
          rows={requests?.incoming}
          render={(r) => (
            <>
              <p className="text-sm text-subtle">
                <span className="text-white">{nameOf(r.requester)}</span> wants to {r.kind === "SWAP" ? "swap for" : "borrow"} your <span className="text-white">{r.wardrobeItem.name}</span>
              </p>
              {r.swapItem && <p className="text-xs text-muted">Offering: {r.swapItem.name}</p>}
              {r.message && <p className="text-xs italic text-muted">“{r.message}”</p>}
              {r.neededBy && <p className="text-xs text-muted">Needed by {new Date(r.neededBy).toLocaleDateString()}</p>}
              <div className="mt-2 flex gap-2">
                {r.status === "PENDING" && (
                  <>
                    <ActionButton className="h-8 px-3 text-xs" loading={busy === r.id} onClick={() => act(r.id, "accept")}>
                      <Check className="size-3.5" />
                      Lend
                    </ActionButton>
                    <ActionButton variant="ghost" className="h-8 px-3 text-xs" disabled={busy === r.id} onClick={() => act(r.id, "decline")}>
                      <X className="size-3.5" />
                      Decline
                    </ActionButton>
                  </>
                )}
                {r.status === "ACCEPTED" && (
                  <ActionButton variant="ghost" className="h-8 px-3 text-xs" loading={busy === r.id} onClick={() => act(r.id, "returned")}>
                    <Undo2 className="size-3.5" />
                    Mark returned
                  </ActionButton>
                )}
              </div>
            </>
          )}
        />
        <RequestList
          title="Your requests"
          rows={requests?.outgoing}
          render={(r) => (
            <>
              <p className="text-sm text-subtle">
                {r.kind === "SWAP" ? "Swap" : "Borrow"} <span className="text-white">{r.wardrobeItem.name}</span> from {nameOf(r.owner)}
              </p>
              <div className="mt-2 flex gap-2">
                {r.status === "PENDING" && (
                  <ActionButton variant="ghost" className="h-8 px-3 text-xs" loading={busy === r.id} onClick={() => act(r.id, "cancel")}>
                    Cancel
                  </ActionButton>
                )}
                {r.status === "ACCEPTED" && (
                  <ActionButton variant="ghost" className="h-8 px-3 text-xs" loading={busy === r.id} onClick={() => act(r.id, "returned")}>
                    <Undo2 className="size-3.5" />
                    I&apos;ve returned it
                  </ActionButton>
                )}
              </div>
            </>
          )}
        />
      </aside>

      <Modal open={Boolean(asking)} onClose={() => setAsking(null)} title={asking ? `Ask for ${asking.name}` : ""}>
        {asking && (
          <BorrowForm
            item={asking}
            myItems={myItems}
            onSent={() => {
              setAsking(null);
              loadRequests();
            }}
          />
        )}
      </Modal>
    </div>
  );
}

function RequestList({ title, rows, render }: { title: string; rows?: BorrowRow[]; render: (r: BorrowRow) => React.ReactNode }) {
  return (
    <section className="card-violet rounded-(--radius-panel) p-5">
      <h3 className="text-sm font-medium text-white">{title}</h3>
      {!rows ? (
        <LoaderCircle className="mt-3 size-5 animate-spin text-accent-bright" />
      ) : rows.length === 0 ? (
        <p className="mt-3 text-sm text-muted">Nothing here yet.</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-3">
          {rows.map((r) => (
            <li key={r.id} className="flex gap-3 rounded-xl border border-white/8 bg-white/[0.02] p-3">
              <span className="aspect-square w-12 shrink-0 overflow-hidden rounded-lg bg-white/[0.05]">
                <Photo src={r.wardrobeItem.image} alt="" fit="contain" />
              </span>
              <div className="min-w-0 flex-1">
                <span className={cn("mb-1 inline-block rounded-full px-2 py-px text-[10px] uppercase tracking-[0.06em]", STATUS_STYLE[r.status])}>{r.status.toLowerCase()}</span>
                {render(r)}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function BorrowForm({ item, myItems, onSent }: { item: CircleWardrobeItem; myItems: WardrobeItem[]; onSent: () => void }) {
  const { token } = useAuth();
  const [kind, setKind] = useState<"BORROW" | "SWAP">("BORROW");
  const [swapItemId, setSwapItemId] = useState(myItems[0]?.id ?? "");
  const [neededBy, setNeededBy] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSending(true);
    setError("");
    try {
      await socialApi.requestBorrow(token, {
        wardrobeItemId: item.id,
        kind,
        swapItemId: kind === "SWAP" ? swapItemId : undefined,
        neededBy: neededBy || undefined,
        message: message.trim() || undefined,
      });
      onSent();
    } catch (err) {
      setError(errorMessage(err));
      setSending(false);
    }
  };

  return (
    <form onSubmit={send} className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <span className="aspect-square w-16 overflow-hidden rounded-lg bg-white/[0.05]">
          <Photo src={item.image} alt="" fit="contain" />
        </span>
        <p className="text-sm text-subtle">{item.onLoan ? "This piece is on loan right now — you can still ask for it next." : "They'll get a notification to lend it or say no."}</p>
      </div>
      <Segmented
        label="Request type"
        value={kind}
        onChange={setKind}
        options={[
          { id: "BORROW", label: "Borrow" },
          { id: "SWAP", label: "Swap" },
        ]}
      />
      {kind === "SWAP" &&
        (myItems.length ? (
          <SelectField label="Offer one of yours" value={swapItemId} onChange={(e) => setSwapItemId(e.target.value)} options={myItems.map((i) => ({ value: i.id, label: `${i.name} (${i.category})` }))} />
        ) : (
          <Notice>Add items to your wardrobe to offer a swap.</Notice>
        ))}
      <Field label="Needed by" type="date" value={neededBy} onChange={(e) => setNeededBy(e.target.value)} />
      <TextArea label="Message" rows={2} maxLength={300} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="e.g. For Riya's sangeet on the 12th!" />
      {error && <Notice tone="error">{error}</Notice>}
      <ActionButton type="submit" loading={sending} disabled={kind === "SWAP" && !swapItemId}>
        <ArrowLeftRight className="size-4" />
        Send request
      </ActionButton>
    </form>
  );
}
