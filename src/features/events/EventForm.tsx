"use client";

import { useState } from "react";
import { ActionButton, Field, Notice, SelectField, TextArea } from "@/components/ui/Controls";
import type { EventInput } from "@/features/social/api";
import { errorMessage } from "@/features/workspace/hooks";

const EVENT_TYPES = ["Wedding", "Sangeet", "Mehendi", "Haldi", "Reception", "Engagement", "Festival / puja", "Party", "Birthday", "Work event", "Trip", "Other"];
const DRESS_CODES = ["", "Traditional / ethnic", "Indo-western", "Cocktail", "Formal", "Smart casual", "Casual", "Colour theme"];

export function EventForm({
  initial,
  circles,
  submitLabel,
  onSubmit,
}: {
  initial?: EventInput;
  circles?: { value: string; label: string }[];
  submitLabel: string;
  onSubmit: (input: EventInput) => Promise<void>;
}) {
  const [circleId, setCircleId] = useState(initial?.circleId ?? circles?.[0]?.value ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [eventType, setEventType] = useState(initial?.eventType ?? EVENT_TYPES[0]);
  const [dressCode, setDressCode] = useState(initial?.dressCode ?? "");
  const [eventDate, setEventDate] = useState(initial?.eventDate ? initial.eventDate.slice(0, 10) : "");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [budget, setBudget] = useState(initial?.budget ? String(initial.budget) : "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await onSubmit({
        circleId: circleId || undefined,
        title: title.trim(),
        eventType,
        dressCode: dressCode || undefined,
        eventDate: eventDate ? new Date(`${eventDate}T12:00:00`).toISOString() : null,
        location: location.trim() || undefined,
        budget: budget ? Math.round(Number(budget)) : null,
        notes: notes.trim() || undefined,
      });
    } catch (err) {
      setError(errorMessage(err));
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      {circles && circles.length > 1 && <SelectField label="Circle" value={circleId} onChange={(e) => setCircleId(e.target.value)} options={circles} />}
      <Field label="Event name" required maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Sharma cousin's sangeet" />
      <div className="grid grid-cols-2 gap-3">
        <SelectField label="Type" value={eventType} onChange={(e) => setEventType(e.target.value)} options={EVENT_TYPES.map((t) => ({ value: t, label: t }))} />
        <SelectField label="Dress code" value={dressCode} onChange={(e) => setDressCode(e.target.value)} options={DRESS_CODES.map((d) => ({ value: d, label: d || "None" }))} />
        <Field label="Date" type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
        <Field label="Budget per person (₹)" type="number" min={0} inputMode="numeric" value={budget} onChange={(e) => setBudget(e.target.value)} />
      </div>
      <Field label="Location" maxLength={120} value={location} onChange={(e) => setLocation(e.target.value)} />
      <TextArea label="Notes" maxLength={1000} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Colour theme, venue details, who's coordinating…" />
      {error && <Notice tone="error">{error}</Notice>}
      <ActionButton type="submit" loading={saving} disabled={!title.trim()}>
        {submitLabel}
      </ActionButton>
    </form>
  );
}
