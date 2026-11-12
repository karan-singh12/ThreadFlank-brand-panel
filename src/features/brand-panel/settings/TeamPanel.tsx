"use client";

import { useState, type FormEvent } from "react";
import { MailPlus } from "lucide-react";
import { ActionButton, Field, Notice } from "@/components/ui/Controls";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/features/auth/AuthProvider";
import { brandApi } from "../api";
import type { TeamMember } from "../types";
import { errorMessage, useResource } from "../useResource";

const load = brandApi.team;

/** The owner adds teammates; they get an email to set their own password. Managers can see the list only. */
export function TeamPanel() {
  const { token, user } = useAuth();
  const team = useResource(load);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  if (team.status === "loading") return <Skeleton className="h-48" />;
  if (team.status === "error" || !team.data) return <Notice tone="error">{team.error || "Could not load your team."}</Notice>;
  const members: TeamMember[] = team.data;
  const me = members.find((m) => m.email.toLowerCase() === (user?.email ?? "").toLowerCase());
  const isOwner = me?.role === "OWNER";

  const invite = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (name.trim().length < 2) return setError("Enter their name.");
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError("Enter a valid email address.");
    setBusy("invite");
    setError("");
    setNotice("");
    try {
      const member = await brandApi.inviteMember(token, { name: name.trim(), email: email.trim() });
      team.setData((prev) => [...(prev ?? []), member]);
      setNotice(`We emailed ${member.email} a link to set their password.`);
      setName("");
      setEmail("");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const toggle = async (m: TeamMember) => {
    if (!token) return;
    setBusy(m.id);
    setError("");
    setNotice("");
    try {
      const res = await brandApi.setMemberActive(token, m.id, !m.isActive);
      team.setData((prev) => (prev ?? []).map((x) => (x.id === m.id ? { ...x, isActive: res.isActive } : x)));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const resend = async (m: TeamMember) => {
    if (!token) return;
    setBusy(m.id);
    setError("");
    setNotice("");
    try {
      await brandApi.resendInvite(token, m.id);
      setNotice(`Invitation sent again to ${m.email}.`);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-5">
      {error && <Notice tone="error">{error}</Notice>}
      {notice && <Notice tone="success">{notice}</Notice>}

      <ul className="divide-y divide-white/[0.06] rounded-xl bg-white/[0.03] ring-1 ring-white/8">
        {members.map((m) => (
          <li key={m.id} className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">
                {m.name} {m.id === me?.id && <span className="text-xs font-normal text-muted">(you)</span>}
              </p>
              <p className="truncate text-xs text-muted">{m.email}</p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                <Badge>{m.role === "OWNER" ? "Owner" : "Manager"}</Badge>
                {m.pending && <Badge tone="warning">Invitation pending</Badge>}
                {!m.isActive && <Badge tone="warning">Disabled</Badge>}
              </div>
            </div>
            {isOwner && m.role !== "OWNER" && (
              <div className="flex shrink-0 gap-2">
                {m.pending && (
                  <ActionButton variant="ghost" className="h-9 px-3 text-xs" loading={busy === m.id} onClick={() => resend(m)}>
                    Resend
                  </ActionButton>
                )}
                <ActionButton variant={m.isActive ? "danger" : "ghost"} className="h-9 px-3 text-xs" loading={busy === m.id} onClick={() => toggle(m)}>
                  {m.isActive ? "Disable" : "Enable"}
                </ActionButton>
              </div>
            )}
          </li>
        ))}
      </ul>

      {isOwner ? (
        <form onSubmit={invite} noValidate className="space-y-3 border-t border-white/8 pt-5">
          <h3 className="text-[11px] font-medium uppercase tracking-[0.14em] text-accent-bright">Invite a teammate</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Asha Verma" />
            <Field label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="asha@yourbrand.com" />
          </div>
          <ActionButton type="submit" loading={busy === "invite"}>
            <MailPlus className="size-4" aria-hidden /> Send invitation
          </ActionButton>
        </form>
      ) : (
        <p className="text-xs text-muted">Only the brand owner can invite or disable teammates.</p>
      )}
    </div>
  );
}
