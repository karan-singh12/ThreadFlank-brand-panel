"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CalendarClock, Clock, Pencil, Plus, Rocket, Trash2, Users } from "lucide-react";
import { ActionButton, Label, Notice } from "@/components/ui/Controls";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { Photo } from "@/components/ui/Photo";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/features/auth/AuthProvider";
import { BrandPageHeader } from "../BrandPageHeader";
import { formatCompactNumber } from "@/lib/utils";
import { brandApi } from "../api";
import type { LaunchDrop } from "../types";
import { errorMessage, useResource } from "../useResource";

const loadDrops = brandApi.drops;

const MAX_GARMENTS = 10_000;

/** Today as YYYY-MM-DD in the browser's time zone, to match what the date input gives us. */
const todayLocal = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const schema = z.object({
  title: z.string().trim().min(2, "Enter a title for the drop"),
  collectionName: z.string().trim().min(2, "Enter the collection's name"),
  launchDate: z
    .string()
    .min(1, "Pick a launch date")
    .refine((v) => v >= todayLocal(), "Launch date can't be in the past"),
  productsCount: z
    .string()
    .refine((v) => Number.isInteger(Number(v)) && Number(v) >= 1 && Number(v) <= MAX_GARMENTS, `Use a whole number from 1 to ${MAX_GARMENTS.toLocaleString("en-IN")}`),
  bannerUrl: z.string().trim().refine((v) => v === "" || (/^https:\/\/\S+$/i.test(v) && URL.canParse(v)), "Enter a full link starting with https://"),
});
type Values = z.infer<typeof schema>;

const input =
  "h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 text-sm text-white outline-none transition placeholder:text-muted/70 hover:border-white/20 focus:border-accent-bright/70 focus:ring-4 focus:ring-accent/20";

const dateLabel = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export function DropsView() {
  const drops = useResource(loadDrops);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<LaunchDrop | null>(null);
  const [deleting, setDeleting] = useState<LaunchDrop | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const { token } = useAuth();
  const [now] = useState(() => Date.now());
  const list = drops.data ?? [];

  const confirmDelete = async () => {
    if (!deleting || !token) return;
    setDeleteBusy(true);
    setDeleteError("");
    try {
      await brandApi.deleteDrop(token, deleting.id);
      drops.setData((prev) => (prev ?? []).filter((d) => d.id !== deleting.id));
      setDeleting(null);
    } catch (e) {
      setDeleteError(errorMessage(e));
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <BrandPageHeader
        eyebrow="Drops"
        title="Launch drops"
        blurb={
          <>
            <span className="text-white">{list.length}</span> {list.length === 1 ? "collection" : "collections"}. Schedule a capsule to open a waitlist before it goes live.
          </>
        }
        actions={
          <ActionButton onClick={() => setOpen(true)} disabled={drops.status !== "ready"}>
            <Plus className="size-4" aria-hidden />
            Schedule new drop
          </ActionButton>
        }
      />

      {drops.status === "loading" ? (
        <div className="grid gap-6 lg:grid-cols-2" aria-busy>
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
      ) : drops.status === "error" ? (
        <ErrorState message={drops.error} onRetry={drops.reload} className="py-16" />
      ) : list.length === 0 ? (
        <EmptyState
          icon={Rocket}
          title="No drops yet"
          description="Schedule a collection to open a waitlist and get it in front of shoppers."
          action={<ActionButton onClick={() => setOpen(true)}>Schedule your first drop</ActionButton>}
          className="py-16"
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {list.map((drop) => (
            <DropCard key={drop.id} drop={drop} now={now} onEdit={() => setEditing(drop)} onDelete={() => { setDeleteError(""); setDeleting(drop); }} />
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Schedule a capsule drop">
        <DropForm onSaved={(drop) => drops.setData((prev) => [drop, ...(prev ?? [])])} onDone={() => setOpen(false)} />
      </Modal>
      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title="Edit drop">
        {editing && (
          <DropForm
            key={editing.id}
            drop={editing}
            onSaved={(drop) => drops.setData((prev) => (prev ?? []).map((d) => (d.id === drop.id ? drop : d)))}
            onDone={() => setEditing(null)}
          />
        )}
      </Modal>
      <Modal open={Boolean(deleting)} onClose={() => setDeleting(null)} title="Delete drop?">
        <div className="space-y-4">
          <p className="text-sm text-muted">
            <span className="text-white">{deleting?.title}</span> and its waitlist will be removed. This can&apos;t be undone.
          </p>
          {deleteError && <Notice tone="error">{deleteError}</Notice>}
          <div className="flex justify-end gap-2">
            <ActionButton variant="ghost" onClick={() => setDeleting(null)}>
              Cancel
            </ActionButton>
            <ActionButton variant="danger" loading={deleteBusy} onClick={confirmDelete}>
              Delete
            </ActionButton>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function DropCard({ drop, now, onEdit, onDelete }: { drop: LaunchDrop; now: number; onEdit: () => void; onDelete: () => void }) {
  const days = Math.max(0, Math.ceil((new Date(drop.launchDate).getTime() - now) / 86_400_000));
  return (
    <article className="card-violet flex flex-col overflow-hidden rounded-(--radius-panel)">
      <div className="relative h-56 w-full bg-[#0b0c22]">
        {drop.bannerUrl ? <Photo src={drop.bannerUrl} alt={drop.title} /> : <CalendarClock className="absolute left-1/2 top-1/2 size-8 -translate-x-1/2 -translate-y-1/2 text-muted" aria-hidden />}
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-[#0b0b1e] via-transparent to-black/30" />
        <div className="absolute left-3 top-3">
          {drop.status === "live" ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green/20 px-2.5 py-1 text-[11px] font-medium text-green ring-1 ring-green/40 backdrop-blur-md">
              <span className="size-1.5 animate-pulse rounded-full bg-green" /> Live in showroom
            </span>
          ) : drop.status === "completed" ? (
            <span className="inline-flex rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-medium text-subtle ring-1 ring-white/10 backdrop-blur-md">Completed</span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-medium text-accent-bright ring-1 ring-white/10 backdrop-blur-md">
              <Clock className="size-3" aria-hidden />
              {days === 0 ? "Starts today" : `Starts in ${days} ${days === 1 ? "day" : "days"}`}
            </span>
          )}
        </div>
        <div className="absolute inset-x-4 bottom-3">
          <p className="text-[11px] uppercase tracking-wider text-accent-bright">{drop.collectionName}</p>
          <h3 className="mt-0.5 text-lg font-medium text-white drop-shadow">{drop.title}</h3>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-white/[0.06] p-5 text-xs">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-muted">
          <span className="flex items-center gap-1.5">
            <Users className="size-3.5 text-white/60" aria-hidden />
            <span className="tabular-nums text-white/90">{formatCompactNumber(drop.waitlistCount)}</span> on waitlist
          </span>
          <span>{drop.productsCount} garments</span>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="pr-1 text-[11px] tabular-nums text-muted">{dateLabel(drop.launchDate)}</span>
          <button type="button" onClick={onEdit} aria-label={`Edit ${drop.title}`} className="glass-pill flex size-8 items-center justify-center rounded-full text-subtle hover:text-white">
            <Pencil className="size-3.5" aria-hidden />
          </button>
          <button type="button" onClick={onDelete} aria-label={`Delete ${drop.title}`} className="glass-pill flex size-8 items-center justify-center rounded-full text-subtle hover:text-white">
            <Trash2 className="size-3.5" aria-hidden />
          </button>
        </div>
      </div>
    </article>
  );
}

function DropForm({ drop, onSaved, onDone }: { drop?: LaunchDrop; onSaved: (d: LaunchDrop) => void; onDone: () => void }) {
  const { token } = useAuth();
  const [serverError, setServerError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: drop
      ? { title: drop.title, collectionName: drop.collectionName, launchDate: drop.launchDate.slice(0, 10), productsCount: String(drop.productsCount), bannerUrl: drop.bannerUrl }
      : { title: "", collectionName: "", launchDate: "", productsCount: "6", bannerUrl: "" },
  });

  const submit = handleSubmit(async (v) => {
    if (!token) return;
    setServerError("");
    try {
      const payload = {
        title: v.title.trim(),
        collectionName: v.collectionName.trim(),
        launchDate: new Date(`${v.launchDate}T00:00:00`).toISOString(),
        bannerUrl: v.bannerUrl,
        productsCount: Number(v.productsCount),
      };
      const saved = drop ? await brandApi.updateDrop(token, drop.id, payload) : await brandApi.createDrop(token, payload);
      onSaved(saved);
      onDone();
    } catch (e) {
      setServerError(errorMessage(e));
    }
  });

  const row = (label: string, error: string | undefined, control: React.ReactNode, hint?: string) => (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      {control}
      {error ? <p role="alert" className="text-xs text-red-300">{error}</p> : hint ? <p className="text-xs text-muted">{hint}</p> : null}
    </div>
  );

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <p className="-mt-2 text-sm text-muted">Activate a waitlist and put the collection in front of shoppers.</p>
      {serverError && <Notice tone="error">{serverError}</Notice>}
      {row("Drop title", errors.title?.message, <input type="text" autoFocus placeholder="e.g. Royal Banaras Capsule '26" aria-invalid={!!errors.title} className={input} {...register("title")} />)}
      {row("Collection name", errors.collectionName?.message, <input type="text" placeholder="e.g. The Heritage Weave" aria-invalid={!!errors.collectionName} className={input} {...register("collectionName")} />)}
      <div className="grid grid-cols-2 gap-3">
        {row("Launch date", errors.launchDate?.message, <input type="date" aria-invalid={!!errors.launchDate} className={input} {...register("launchDate")} />)}
        {row("Garment count", errors.productsCount?.message, <input type="number" min={1} inputMode="numeric" aria-invalid={!!errors.productsCount} className={input} {...register("productsCount")} />)}
      </div>
      {row("Cover banner link", errors.bannerUrl?.message, <input type="url" placeholder="https://…" aria-invalid={!!errors.bannerUrl} className={input} {...register("bannerUrl")} />, "Optional")}
      <div className="flex justify-end gap-2 pt-2">
        <ActionButton variant="ghost" onClick={onDone}>
          Cancel
        </ActionButton>
        <ActionButton type="submit" loading={isSubmitting}>
          {drop ? "Save changes" : "Publish to calendar"}
        </ActionButton>
      </div>
    </form>
  );
}
