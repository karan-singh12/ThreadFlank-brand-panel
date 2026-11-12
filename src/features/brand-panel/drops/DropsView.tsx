"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CalendarClock, Clock, Plus, Rocket, Users } from "lucide-react";
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

const schema = z.object({
  title: z.string().trim().min(2, "Enter a title for the drop"),
  collectionName: z.string().trim().min(2, "Enter the collection's name"),
  launchDate: z.string().min(1, "Pick a launch date"),
  productsCount: z.string().refine((v) => Number.isInteger(Number(v)) && Number(v) >= 1, "Use a whole number, 1 or more"),
  bannerUrl: z.string().trim().url("Enter a full link starting with https://").or(z.literal("")),
});
type Values = z.infer<typeof schema>;

const input =
  "h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 text-sm text-white outline-none transition placeholder:text-muted/70 hover:border-white/20 focus:border-accent-bright/70 focus:ring-4 focus:ring-accent/20";

const dateLabel = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export function DropsView() {
  const drops = useResource(loadDrops);
  const [open, setOpen] = useState(false);
  const [now] = useState(() => Date.now());
  const list = drops.data ?? [];

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
            <DropCard key={drop.id} drop={drop} now={now} />
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Schedule a capsule drop">
        <DropForm
          onCreated={(drop) => drops.setData((prev) => [drop, ...(prev ?? [])])}
          onDone={() => setOpen(false)}
        />
      </Modal>
    </div>
  );
}

function DropCard({ drop, now }: { drop: LaunchDrop; now: number }) {
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
        <span className="shrink-0 text-[11px] tabular-nums text-muted">{dateLabel(drop.launchDate)}</span>
      </div>
    </article>
  );
}

function DropForm({ onCreated, onDone }: { onCreated: (d: LaunchDrop) => void; onDone: () => void }) {
  const { token } = useAuth();
  const [serverError, setServerError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", collectionName: "", launchDate: "", productsCount: "6", bannerUrl: "" },
  });

  const submit = handleSubmit(async (v) => {
    if (!token) return;
    setServerError("");
    try {
      const drop = await brandApi.createDrop(token, {
        title: v.title.trim(),
        collectionName: v.collectionName.trim(),
        launchDate: new Date(`${v.launchDate}T00:00:00`).toISOString(),
        bannerUrl: v.bannerUrl,
        productsCount: Number(v.productsCount),
      });
      onCreated(drop);
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
          Publish to calendar
        </ActionButton>
      </div>
    </form>
  );
}
