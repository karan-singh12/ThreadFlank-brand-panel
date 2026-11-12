"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BadgeCheck, Clock, LoaderCircle, Scissors, ShieldAlert } from "lucide-react";
import { ActionButton, Field, Notice, TextArea } from "@/components/ui/Controls";
import { useAuth } from "@/features/auth/AuthProvider";
import { socialApi, type StylistProfile } from "@/features/social/api";
import { errorMessage } from "@/features/workspace/hooks";

const STATUS = {
  PENDING: { icon: Clock, text: "Your application is being reviewed by our team.", tone: "text-amber-200" },
  VERIFIED: { icon: BadgeCheck, text: "You're a verified stylist. Looks from shoppers who ask for a review appear in your queue.", tone: "text-green" },
  REJECTED: { icon: ShieldAlert, text: "Your application wasn't approved. Update your profile and resubmit.", tone: "text-red-300" },
  SUSPENDED: { icon: ShieldAlert, text: "Your stylist profile is suspended. Contact support for details.", tone: "text-red-300" },
} as const;

/** Apply to be a verified stylist or tailor (feature #21), and see your status. */
export function StylistTab() {
  const { token } = useAuth();
  const [profile, setProfile] = useState<StylistProfile | null | undefined>(undefined);
  const [displayName, setDisplayName] = useState("");
  const [city, setCity] = useState("");
  const [bio, setBio] = useState("");
  const [specialties, setSpecialties] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!token) return;
    socialApi
      .myStylist(token)
      .then((p) => {
        setProfile(p);
        if (p) {
          setDisplayName(p.displayName);
          setCity(p.city ?? "");
          setBio(p.bio ?? "");
          setSpecialties((p.specialties ?? []).join(", "));
          setPortfolioUrl(p.portfolioUrl ?? "");
        }
      })
      .catch(() => setProfile(null));
  }, [token]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    setNotice(null);
    try {
      const next = await socialApi.applyStylist(token, {
        displayName: displayName.trim(),
        city: city.trim() || undefined,
        bio: bio.trim() || undefined,
        specialties: specialties
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        portfolioUrl: portfolioUrl.trim() || undefined,
      });
      setProfile(next);
      setNotice({ tone: "success", text: next.status === "VERIFIED" ? "Profile updated" : "Application submitted" });
    } catch (err) {
      setNotice({ tone: "error", text: errorMessage(err) });
    } finally {
      setSaving(false);
    }
  };

  if (profile === undefined) {
    return (
      <div className="flex justify-center py-16" role="status" aria-label="Loading">
        <LoaderCircle className="size-6 animate-spin text-accent-bright" />
      </div>
    );
  }

  const status = profile ? STATUS[profile.status] : null;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <form onSubmit={submit} className="card-violet flex flex-col gap-5 rounded-(--radius-panel) p-6">
        <div>
          <h2 className="flex items-center gap-2 text-title font-medium text-white">
            <Scissors className="size-5 text-accent-bright" />
            {profile ? "Your stylist profile" : "Become a verified stylist"}
          </h2>
          <p className="mt-1 text-sm text-muted">Stylists and tailors review looks that shoppers submit — especially wedding and festive wear — and suggest how to restyle them.</p>
        </div>
        <Field label="Name clients see" required maxLength={60} value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        <Field label="City" maxLength={60} value={city} onChange={(e) => setCity(e.target.value)} />
        <TextArea label="About you" maxLength={600} value={bio} onChange={(e) => setBio(e.target.value)} />
        <Field label="Specialties" hint="Comma separated, e.g. bridal, sherwani, alterations" value={specialties} onChange={(e) => setSpecialties(e.target.value)} />
        <Field label="Portfolio link" type="url" maxLength={300} value={portfolioUrl} onChange={(e) => setPortfolioUrl(e.target.value)} placeholder="https://instagram.com/…" />
        <div className="flex flex-wrap items-center gap-3">
          <ActionButton type="submit" loading={saving} disabled={!displayName.trim() || profile?.status === "SUSPENDED"}>
            {profile ? "Save profile" : "Apply"}
          </ActionButton>
          {notice && <Notice tone={notice.tone}>{notice.text}</Notice>}
        </div>
      </form>

      <aside className="flex flex-col gap-3 lg:sticky lg:top-24 lg:h-fit">
        {status ? (
          <div className="card-violet flex flex-col gap-3 rounded-(--radius-panel) p-5">
            <p className={`flex items-center gap-2 text-sm font-medium ${status.tone}`}>
              <status.icon className="size-4" />
              {profile!.status.charAt(0) + profile!.status.slice(1).toLowerCase()}
            </p>
            <p className="text-sm text-muted">{status.text}</p>
            {profile!.rejectionReason && <p className="text-sm text-subtle">Reason: {profile!.rejectionReason}</p>}
            {profile!.status === "VERIFIED" && (
              <Link href="/stylist" className="btn-primary inline-flex h-11 items-center justify-center rounded-full text-sm font-medium">
                Open review queue
              </Link>
            )}
          </div>
        ) : (
          <Notice>Once you apply, our team verifies your profile. You can then review looks from shoppers.</Notice>
        )}
      </aside>
    </div>
  );
}
