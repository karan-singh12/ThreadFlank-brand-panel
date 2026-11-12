"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarHeart, CheckCircle2, LoaderCircle, MapPin, Plus, Radio, Users } from "lucide-react";
import { ActionButton, Notice } from "@/components/ui/Controls";
import { Modal } from "@/components/ui/Modal";
import { useAuth } from "@/features/auth/AuthProvider";
import { socialApi, type EventSummary } from "@/features/social/api";
import { errorMessage, useCircle } from "@/features/workspace/hooks";
import { cn } from "@/lib/utils";
import { EventForm } from "./EventForm";

export const formatEventDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" }) : "Date to be decided";

/** Real events for your Twin Circle (feature #10): everyone's planned look in one place. Shown as a tab of the Saved page. */
export function EventsPanel({ onCreate }: { onCreate: () => void }) {
  const { token } = useAuth();
  const circle = useCircle();
  const [events, setEvents] = useState<EventSummary[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    socialApi
      .events(token)
      .then(setEvents)
      .catch((e) => setError(errorMessage(e)));
  }, [token]);

  const upcoming = (events ?? []).filter((e) => !e.isPast);
  const past = (events ?? []).filter((e) => e.isPast);

  return (
    <div>
      <p className="max-w-[560px] text-sm text-muted">Plan what everyone in your circle wears for a wedding, sangeet or party — and get ready together.</p>

      {circle.members.length === 0 && !circle.loading && (
        <div className="mt-6">
          <Notice>
            Events are shared with your Twin Circle.{" "}
            <Link href="/profile?tab=circle" className="text-accent-bright hover:text-white">
              Add people to your circle
            </Link>{" "}
            to plan together.
          </Notice>
        </div>
      )}
      {error && (
        <div className="mt-6">
          <Notice tone="error">{error}</Notice>
        </div>
      )}

      {events === null && !error ? (
        <div className="flex justify-center py-20" role="status" aria-label="Loading">
          <LoaderCircle className="size-6 animate-spin text-accent-bright" />
        </div>
      ) : events && events.length === 0 ? (
        <div className="card-violet mt-6 flex flex-col items-center rounded-(--radius-panel) px-6 py-10 text-center">
          <CalendarHeart className="size-10 text-muted" strokeWidth={1.5} />
          <p className="mt-4 text-title text-white">No events yet</p>
          <p className="mt-1 max-w-[380px] text-sm text-muted">Create one — e.g. “Sharma cousin&apos;s sangeet, Dec 12” — and everyone in your circle picks their look.</p>
          <ActionButton onClick={onCreate} className="mt-6">
            <Plus className="size-4" />
            New event
          </ActionButton>
        </div>
      ) : (
        <>
          <EventList title="Upcoming" events={upcoming} />
          {past.length > 0 && <EventList title="Past" events={past} muted />}
        </>
      )}
    </div>
  );
}

/** Create-event dialog; opens the new event's page once it's saved. */
export function NewEventModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { token } = useAuth();
  const router = useRouter();
  const circle = useCircle();
  const circles = [
    { value: circle.state?.circle.id ?? "", label: "My circle" },
    ...circle.memberships.filter((m) => m.status === "ACTIVE").map((m) => ({ value: m.circleId, label: `${m.owner?.username || m.owner?.email.split("@")[0] || "Friend"}'s circle` })),
  ].filter((c) => c.value);

  return (
    <Modal open={open} onClose={onClose} title="New event" className="sm:max-w-[600px]">
      {open && (
        <EventForm
          circles={circles}
          submitLabel="Create event"
          onSubmit={async (input) => {
            if (!token) return;
            const created = await socialApi.createEvent(token, input);
            router.push(`/events/${created.id}`);
          }}
        />
      )}
    </Modal>
  );
}

function EventList({ title, events, muted = false }: { title: string; events: EventSummary[]; muted?: boolean }) {
  if (!events.length) return null;
  return (
    <section className="mt-8">
      <h2 className="text-sm font-medium uppercase tracking-[0.08em] text-muted">{title}</h2>
      <ul className="mt-3 grid gap-4 sm:grid-cols-2">
        {events.map((e) => (
          <li key={e.id}>
            <Link href={`/events/${e.id}`} className={cn("card-violet flex flex-col gap-3 rounded-(--radius-panel) p-5 transition hover:border-accent-bright/50", muted && "opacity-70")}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-body font-medium text-white">{e.title}</p>
                  <p className="mt-0.5 text-xs text-muted">{formatEventDate(e.eventDate)}</p>
                </div>
                {e.grwmLiveAt && (
                  <span className="flex shrink-0 items-center gap-1 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-semibold uppercase text-white">
                    <Radio className="size-3" />
                    GRWM live
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-subtle">
                {e.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3" />
                    {e.location}
                  </span>
                )}
                {e.dressCode && <span>{e.dressCode}</span>}
                <span className="flex items-center gap-1">
                  <Users className="size-3" />
                  {e.participants}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/8">
                  <div className="h-full rounded-full bg-accent-bright" style={{ width: `${e.participants ? (e.locked / e.participants) * 100 : 0}%` }} />
                </div>
                <span className="text-[11px] text-muted">
                  {e.locked}/{e.participants} locked in
                </span>
              </div>
              {e.myPlanDone && (
                <span className="flex items-center gap-1 text-xs text-green">
                  <CheckCircle2 className="size-3.5" />
                  Your look is locked in
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
