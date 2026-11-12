"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Layers, LoaderCircle, LogOut, Mail, Pencil, Shirt, Trash2, UserPlus, Users, X } from "lucide-react";
import { ActionButton, Field, Notice, SelectField } from "@/components/ui/Controls";
import { Modal } from "@/components/ui/Modal";
import { Photo } from "@/components/ui/Photo";
import { useAuth } from "@/features/auth/AuthProvider";
import { chatApi } from "@/features/messages/api";
import type { FriendUser } from "@/features/messages/types";
import { nameOf } from "@/features/social/api";
import { errorMessage, useCircle, type CircleMember } from "@/features/workspace/hooks";
import { cn } from "@/lib/utils";
import { RELATIONS, profileContent as copy } from "@/data/studio-content";
import { BodyForm, EMPTY_BODY, skinLabel, toNumber, type BodyValues } from "./BodyForm";

const str = (n: number | null | undefined) => (n ? String(n) : "");

export function bodySummary(p: { heightCm?: number | null; weightKg?: number | null; age?: number | null; skinTone?: string | null }) {
  return [p.age && `${p.age}y`, p.heightCm && `${p.heightCm} cm`, p.weightKg && `${p.weightKg} kg`, skinLabel(p.skinTone)].filter(Boolean).join(" · ");
}

/** Your Twin Circle: managed profiles for family without an account, and friends linked by invite. */
export function CircleTab() {
  const circle = useCircle();
  const [editing, setEditing] = useState<CircleMember | "new" | null>(null);
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const { members, limit, memberships } = circle;
  const full = members.length >= limit;
  const invites = memberships.filter((m) => m.status === "INVITED");
  const joined = memberships.filter((m) => m.status === "ACTIVE");

  const act = async (id: string, fn: () => Promise<unknown>) => {
    setBusy(id);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  if (circle.loading) {
    return (
      <div className="flex justify-center py-16" role="status" aria-label="Loading">
        <LoaderCircle className="size-6 animate-spin text-accent-bright" />
      </div>
    );
  }

  return (
    <section className="flex flex-col gap-8">
      {invites.length > 0 && (
        <div className="card-violet flex flex-col gap-3 rounded-(--radius-panel) p-5">
          <h3 className="flex items-center gap-2 text-sm font-medium text-white">
            <Mail className="size-4 text-accent-bright" />
            Circle invites
          </h3>
          {invites.map((inv) => (
            <div key={inv.memberId} className="flex flex-wrap items-center gap-3">
              <span className="text-sm text-subtle">
                <span className="text-white">{nameOf(inv.owner)}</span> invited you to their Twin Circle{inv.relation ? ` as ${inv.relation.toLowerCase()}` : ""}.
              </span>
              <div className="ml-auto flex gap-2">
                <ActionButton className="h-9" loading={busy === inv.memberId} onClick={() => act(inv.memberId, () => circle.respondInvite(inv.memberId, true))}>
                  <Check className="size-4" />
                  Join
                </ActionButton>
                <ActionButton variant="ghost" className="h-9" disabled={busy === inv.memberId} onClick={() => act(inv.memberId, () => circle.respondInvite(inv.memberId, false))}>
                  <X className="size-4" />
                  Decline
                </ActionButton>
              </div>
            </div>
          ))}
        </div>
      )}

      <div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-title font-medium text-white">{copy.circleTitle}</h2>
            <p className="mt-1 max-w-[560px] text-sm text-muted">{copy.circleDescription(limit)}</p>
          </div>
          <div className="flex gap-2 self-start">
            <ActionButton variant="ghost" onClick={() => setInviting(true)} disabled={full}>
              <Users className="size-4" />
              Invite a friend
            </ActionButton>
            <ActionButton onClick={() => setEditing("new")} disabled={full}>
              <UserPlus className="size-4" />
              {copy.addMember}
            </ActionButton>
          </div>
        </div>
        {full && (
          <div className="mt-4">
            <Notice>{copy.circleFull(limit)}</Notice>
          </div>
        )}
        {error && (
          <div className="mt-4">
            <Notice tone="error">{error}</Notice>
          </div>
        )}

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((m) => (
            <article key={m.id} className="card-violet flex gap-4 rounded-(--radius-panel) p-4">
              <div className="aspect-[3/4] w-24 shrink-0 overflow-hidden rounded-xl bg-white/[0.04]">
                {m.photo ? <Photo src={m.photo} alt={m.name} /> : <div className="flex size-full items-center justify-center text-2xl text-muted">{m.name.charAt(0)}</div>}
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <p className="truncate text-body font-medium text-white">{m.name}</p>
                <p className="flex flex-wrap items-center gap-1.5 text-xs text-accent-bright">
                  {m.relation}
                  {m.kind === "USER" && <span className="rounded-full bg-white/8 px-1.5 py-px text-[10px] text-subtle">linked account</span>}
                  {m.status === "INVITED" && <span className="rounded-full bg-amber-400/15 px-1.5 py-px text-[10px] text-amber-200">invite sent</span>}
                </p>
                <p className="mt-1 text-xs text-muted">{bodySummary(m) || "—"}</p>
                <div className="mt-auto flex flex-wrap gap-1.5 pt-3">
                  {m.status === "ACTIVE" && (
                    <Link href={`/drape?person=${m.id}`} className="flex h-8 items-center gap-1.5 rounded-full bg-white/8 px-3 text-xs text-white hover:bg-white/12">
                      <Shirt className="size-3.5" />
                      {copy.drapeOn}
                    </Link>
                  )}
                  {m.kind === "USER" && m.status === "ACTIVE" && m.userId && (
                    <Link href={`/wardrobe?tab=borrow&member=${m.userId}`} className="flex h-8 items-center gap-1.5 rounded-full bg-white/8 px-3 text-xs text-white hover:bg-white/12">
                      <Layers className="size-3.5" />
                      Wardrobe
                    </Link>
                  )}
                  <button type="button" onClick={() => setEditing(m)} aria-label={`${copy.editMember} ${m.name}`} className="flex size-8 items-center justify-center rounded-full text-muted hover:bg-white/8 hover:text-white">
                    <Pencil className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => act(m.id, () => circle.removeMember(m.id))}
                    disabled={busy === m.id}
                    aria-label={`${copy.removeMember} ${m.name}`}
                    className="flex size-8 items-center justify-center rounded-full text-muted hover:bg-red-500/10 hover:text-red-300"
                  >
                    {busy === m.id ? <LoaderCircle className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                  </button>
                </div>
              </div>
            </article>
          ))}
          {!full && (
            <button
              type="button"
              onClick={() => setEditing("new")}
              className="flex min-h-[152px] flex-col items-center justify-center gap-2 rounded-(--radius-panel) border border-dashed border-white/15 text-sm text-muted transition-colors hover:border-accent-bright/60 hover:text-white"
            >
              <UserPlus className="size-6" strokeWidth={1.5} />
              {members.length ? copy.addMember : copy.circleEmpty}
            </button>
          )}
        </div>
      </div>

      {joined.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-white">Circles you&apos;re in</h3>
          <ul className="mt-3 flex flex-col gap-2">
            {joined.map((m) => (
              <li key={m.memberId} className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.02] px-4 py-3">
                <span className="flex size-9 items-center justify-center overflow-hidden rounded-full bg-accent text-sm text-white">
                  {m.owner?.avatar ? <Photo src={m.owner.avatar} alt="" /> : nameOf(m.owner).charAt(0).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm text-subtle">
                  <span className="text-white">{nameOf(m.owner)}</span>&apos;s circle
                </span>
                <Link href={`/wardrobe?tab=borrow&member=${m.owner?.id}`} className="text-xs text-accent-bright hover:text-white">
                  Their wardrobe
                </Link>
                <button type="button" onClick={() => act(m.circleId, () => circle.leave(m.circleId))} className="flex items-center gap-1 text-xs text-muted hover:text-red-300">
                  <LogOut className="size-3.5" />
                  Leave
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Modal open={editing !== null} onClose={() => setEditing(null)} title={editing === "new" ? copy.addMember : copy.editMember} className="sm:max-w-[600px]">
        {editing !== null && (
          <MemberForm
            initial={editing === "new" ? null : editing}
            onCancel={() => setEditing(null)}
            onSave={async (input) => {
              if (editing === "new") await circle.addProfile(input);
              else await circle.updateMember(editing.id, input);
              setEditing(null);
            }}
          />
        )}
      </Modal>

      <Modal open={inviting} onClose={() => setInviting(false)} title="Invite a friend to your circle">
        {inviting && (
          <InviteForm
            existing={new Set(members.map((m) => m.userId).filter((id): id is string => Boolean(id)))}
            onInvite={async (userId, relation) => {
              await circle.invite(userId, relation);
              setInviting(false);
            }}
          />
        )}
      </Modal>
    </section>
  );
}

type MemberInput = { name: string; relation: string; gender?: string; age?: number; heightCm?: number; weightKg?: number; skinTone?: string; photo?: string; twin?: string };

function MemberForm({ initial, onSave, onCancel }: { initial: CircleMember | null; onSave: (m: MemberInput) => Promise<void>; onCancel: () => void }) {
  const linked = initial?.kind === "USER";
  const [name, setName] = useState(initial?.name ?? "");
  const [relation, setRelation] = useState(initial?.relation ?? RELATIONS[0]);
  const [consent, setConsent] = useState(Boolean(initial));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [body, setBody] = useState<BodyValues>(() =>
    initial
      ? { photo: initial.photo ?? "", gender: initial.gender, age: str(initial.age), heightCm: str(initial.heightCm), weightKg: str(initial.weightKg), skinTone: initial.skinTone ?? "" }
      : EMPTY_BODY
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await onSave({
        name: name.trim(),
        relation,
        gender: body.gender || undefined,
        age: toNumber(body.age),
        heightCm: toNumber(body.heightCm),
        weightKg: toNumber(body.weightKg),
        skinTone: body.skinTone || undefined,
        photo: body.photo || undefined,
      });
    } catch (err) {
      setError(errorMessage(err));
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3">
        <Field label={copy.memberName} required maxLength={40} value={name} onChange={(e) => setName(e.target.value)} disabled={linked} />
        <SelectField label={copy.relation} value={relation} onChange={(e) => setRelation(e.target.value)} options={RELATIONS.map((r) => ({ value: r, label: r }))} />
      </div>
      {linked ? (
        <Notice>{name} manages their own selfie and body details from their account.</Notice>
      ) : (
        <>
          <BodyForm value={body} onChange={setBody} />
          <label className="flex items-start gap-3 text-sm text-subtle">
            <input type="checkbox" required checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 size-4 accent-[#6645eb]" />
            {copy.consent}
          </label>
        </>
      )}
      {error && <Notice tone="error">{error}</Notice>}
      <div className="flex justify-end gap-2">
        <ActionButton variant="ghost" onClick={onCancel}>
          Cancel
        </ActionButton>
        <ActionButton type="submit" loading={saving} disabled={!name.trim() || (!linked && !consent)}>
          {initial ? "Save" : copy.addMember}
        </ActionButton>
      </div>
    </form>
  );
}

function InviteForm({ existing, onInvite }: { existing: Set<string>; onInvite: (userId: string, relation: string) => Promise<void> }) {
  const { token } = useAuth();
  const [friends, setFriends] = useState<FriendUser[] | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [relation, setRelation] = useState<string>("Friend");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    chatApi
      .fetchFriendsList(token)
      .then(setFriends)
      .catch(() => setFriends([]));
  }, [token]);

  const available = (friends ?? []).filter((f) => !existing.has(f.id));

  const send = async () => {
    if (!picked) return;
    setSending(true);
    setError("");
    try {
      await onInvite(picked, relation);
    } catch (e) {
      setError(errorMessage(e));
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted">Linked friends keep their own twin, can share wardrobes for borrowing, and join your events and Get Ready With Me sessions.</p>
      {friends === null ? (
        <LoaderCircle className="size-5 animate-spin text-accent-bright" />
      ) : available.length === 0 ? (
        <Notice>
          No friends to invite yet.{" "}
          <Link href="/messages" className="text-accent-bright hover:text-white">
            Add friends in Messages
          </Link>
          .
        </Notice>
      ) : (
        <ul role="radiogroup" aria-label="Friends" className="flex max-h-64 flex-col gap-1 overflow-y-auto">
          {available.map((f) => (
            <li key={f.id}>
              <button
                type="button"
                role="radio"
                aria-checked={picked === f.id}
                onClick={() => setPicked(f.id)}
                className={cn("flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors", picked === f.id ? "bg-accent/25" : "hover:bg-white/[0.04]")}
              >
                <span className="flex size-9 items-center justify-center overflow-hidden rounded-full bg-accent text-sm text-white">
                  {f.avatar ? <Photo src={f.avatar} alt="" /> : nameOf(f).charAt(0).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm text-white">{nameOf(f)}</span>
                {picked === f.id && <Check className="size-4 text-accent-bright" />}
              </button>
            </li>
          ))}
        </ul>
      )}
      <SelectField label={copy.relation} value={relation} onChange={(e) => setRelation(e.target.value)} options={RELATIONS.map((r) => ({ value: r, label: r }))} />
      {error && <Notice tone="error">{error}</Notice>}
      <ActionButton onClick={send} loading={sending} disabled={!picked}>
        <Mail className="size-4" />
        Send invite
      </ActionButton>
    </div>
  );
}
