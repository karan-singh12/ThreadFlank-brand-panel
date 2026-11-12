"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Calendar, Camera, LoaderCircle, MapPin, Pencil, Phone, Scissors, Shirt, Sparkles, Users } from "lucide-react";
import { ActionButton, Field, Label, Notice, TextArea } from "@/components/ui/Controls";
import { Photo } from "@/components/ui/Photo";
import { useAuth } from "@/features/auth/AuthProvider";
import { writeSession } from "@/features/auth/storage";
import type { AuthUser } from "@/features/auth/types";
import { workspaceApi, type TwinProfile } from "@/features/workspace/api";
import { errorMessage, useCircle, useScenePreference, useScenes, useTwin, useUserProfile } from "@/features/workspace/hooks";
import { assetUrl } from "@/lib/api/config";
import { cn } from "@/lib/utils";
import { profileContent as copy } from "@/data/studio-content";
import { BodyForm, EMPTY_BODY, toNumber, type BodyValues } from "./BodyForm";
import { CircleTab, bodySummary } from "./CircleTab";
import { StylistTab } from "./StylistTab";
import { AiUsageCard } from "./AiUsageCard";

const TABS = ["twin", "circle", "stylist", "account"] as const;
type Tab = (typeof TABS)[number];


const str = (n: number | null | undefined) => (n ? String(n) : "");

function twinToBody(t: TwinProfile | null): BodyValues {
  if (!t) return EMPTY_BODY;
  return {
    photo: t.selfieUrl || "",
    gender: t.gender ?? "",
    age: str(t.age),
    heightCm: str(t.heightCm),
    weightKg: str(t.weightKg),
    skinTone: t.skinTone ?? "",
  };
}


export function ProfileView() {
  const { user } = useAuth();
  const { profile, loading: profileLoading, refresh: refreshProfile } = useUserProfile();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const rawTab = params.get("tab");
  const tab: Tab = rawTab && (TABS as readonly string[]).includes(rawTab) ? (rawTab as Tab) : "twin";
  const { members, limit } = useCircle();

  useEffect(() => {
    if (rawTab === "looks") {
      router.replace("/saved");
    }
  }, [rawTab, router]);

  const currentUser = profile ?? user;
  const name = currentUser?.username || currentUser?.email.split("@")[0] || "";

  const tabs: { id: Tab; label: string; icon: typeof Users }[] = [
    { id: "twin", label: copy.tabs.twin, icon: Sparkles },
    { id: "circle", label: `${copy.tabs.circle} · ${members.length}/${limit}`, icon: Users },
    { id: "stylist", label: "Stylist", icon: Scissors },
    { id: "account", label: copy.tabs.account, icon: Pencil },
  ];

  return (
    <main className="mx-auto max-w-[1080px] px-4 py-8 sm:px-8 lg:py-12">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4 min-w-0">
          <span className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent text-2xl font-medium text-white ring-2 ring-white/10">
            {currentUser?.avatar ? <Photo src={currentUser.avatar} alt={name} /> : name.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="chrome truncate text-[2rem] font-medium leading-tight tracking-[-0.03em]">{name}</h1>
              {profileLoading && <LoaderCircle className="size-4 animate-spin text-muted shrink-0" />}
            </div>
            <p className="truncate text-sm text-muted">{currentUser?.email}</p>
            {currentUser?.bio && <p className="mt-1 text-xs text-white/70 line-clamp-1">{currentUser.bio}</p>}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
          {currentUser?.location && (
            <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1">
              <MapPin className="size-3 text-accent-bright" />
              {currentUser.location}
            </span>
          )}
          {currentUser?.phone && (
            <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1">
              <Phone className="size-3 text-accent-bright" />
              {currentUser.phone}
            </span>
          )}
          {currentUser?.createdAt && (
            <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1">
              <Calendar className="size-3 text-muted" />
              Joined {new Date(currentUser.createdAt).toLocaleDateString(undefined, { month: "short", year: "numeric" })}
            </span>
          )}
        </div>
      </header>

      <div role="tablist" aria-label="Profile sections" className="no-scrollbar -mx-4 mt-8 flex gap-2 overflow-x-auto border-b border-white/8 px-4 sm:mx-0 sm:px-0">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => router.replace(`${pathname}?tab=${t.id}`, { scroll: false })}
            className={cn(
              "-mb-px flex h-11 shrink-0 items-center gap-2 border-b-2 px-3 text-sm transition-colors",
              tab === t.id ? "border-accent-bright text-white" : "border-transparent text-muted hover:text-white"
            )}
          >
            <t.icon className="size-4" strokeWidth={1.75} />
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {tab === "twin" && <TwinTab />}
        {tab === "circle" && <CircleTab />}
        {tab === "stylist" && <StylistTab />}
        {tab === "account" && (
          <div className="flex flex-col gap-6">
            <AccountTab key={currentUser?.id} profile={currentUser} onRefresh={refreshProfile} />
            <AiUsageCard />
          </div>
        )}
      </div>
    </main>
  );
}

// ─── My twin ─────────────────────────────────────────────────────────────────

function TwinTab() {
  const { twin, loading, save } = useTwin();
  if (loading) return <Loading />;
  return <TwinEditor initial={twin} save={save} />;
}

function TwinEditor({ initial, save }: { initial: TwinProfile | null; save: ReturnType<typeof useTwin>["save"] }) {
  const [body, setBody] = useState<BodyValues>(() => twinToBody(initial));
  const scenes = useScenes();
  const [sceneId, chooseScene] = useScenePreference();
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const scene = scenes.find((b) => b.id === sceneId) ?? scenes.find((b) => b.isDefault) ?? scenes[0];

  // A new selfie is saved straight away, so it's never lost and Drape can use it at once.
  // Saving it also clears any old AI twin, which is no longer used.
  const changeBody = (next: BodyValues) => {
    setBody(next);
    if (next.photo !== body.photo) {
      save({ selfieUrl: next.photo, baseAvatarUrl: "" })
        .then(() => setNotice({ tone: "success", text: copy.saved }))
        .catch((e) => setNotice({ tone: "error", text: errorMessage(e) }));
    }
  };

  const submit = async () => {
    setSaving(true);
    setNotice(null);
    try {
      await save({
        gender: body.gender || undefined,
        age: toNumber(body.age),
        heightCm: toNumber(body.heightCm),
        weightKg: toNumber(body.weightKg),
        skinTone: body.skinTone || undefined,
        // An empty string clears a removed selfie.
        selfieUrl: body.photo,
        baseAvatarUrl: "",
      });
      setNotice({ tone: "success", text: copy.saved });
    } catch (e) {
      setNotice({ tone: "error", text: errorMessage(e) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <section className="card-violet rounded-(--radius-panel) p-6">
        <h2 className="text-title font-medium text-white">{copy.twinTitle}</h2>
        <p className="mt-1 text-sm text-muted">{copy.twinDescription}</p>
        <div className="mt-6">
          <BodyForm value={body} onChange={changeBody} />
        </div>

        <div className="mt-6 flex flex-col gap-2">
          <Label>{copy.background}</Label>
          <div role="radiogroup" aria-label={copy.background} className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {scenes.map((b) => (
              <button
                key={b.id}
                type="button"
                role="radio"
                aria-checked={scene?.id === b.id}
                onClick={() => chooseScene(b.id)}
                className={cn(
                  "relative flex aspect-square items-end overflow-hidden rounded-xl p-1.5 text-left text-[11px] leading-tight text-white ring-offset-2 ring-offset-[#0b0b1e] [text-shadow:0_1px_2px_rgba(0,0,0,0.6)]",
                  scene?.id === b.id ? "ring-2 ring-accent-bright" : "opacity-80 hover:opacity-100"
                )}
                style={{ background: b.cssGradient || "#1a1838", backgroundImage: b.imageUrl ? `url(${assetUrl(b.imageUrl)})` : undefined, backgroundSize: "cover" }}
              >
                <span className="relative">{b.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <ActionButton loading={saving} onClick={submit}>
            {copy.save}
          </ActionButton>
          {notice && <Notice tone={notice.tone}>{notice.text}</Notice>}
        </div>
      </section>

      <aside className="flex flex-col gap-3 lg:sticky lg:top-24 lg:h-fit">
        <div className="relative aspect-[3/4] overflow-hidden rounded-(--radius-panel) border border-white/10" style={{ background: scene?.cssGradient || "#1a1838" }}>
          {body.photo ? (
            <Photo src={body.photo} alt="Your selfie" fit="contain" />
          ) : (
            <div className="flex size-full items-center justify-center text-sm text-white/70">{copy.twinMissing}</div>
          )}
        </div>
        <p className="text-center text-sm text-muted">{bodySummary({ age: toNumber(body.age), heightCm: toNumber(body.heightCm), weightKg: toNumber(body.weightKg), skinTone: body.skinTone }) || "—"}</p>
        <Link href="/drape?person=me" className="btn-light flex h-11 items-center justify-center gap-2 rounded-full text-sm font-medium">
          <Shirt className="size-4" />
          {copy.drapeOn} you
        </Link>
      </aside>
    </div>
  );
}

// ─── Account ─────────────────────────────────────────────────────────────────

function AccountTab({ profile, onRefresh }: { profile: AuthUser | null; onRefresh?: () => void }) {
  const { user, token } = useAuth();
  const [username, setUsername] = useState(profile?.username ?? user?.username ?? "");
  const [bio, setBio] = useState(profile?.bio ?? user?.bio ?? "");
  const [location, setLocation] = useState(profile?.location ?? user?.location ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? user?.phone ?? "");
  const [avatar, setAvatar] = useState(profile?.avatar ?? user?.avatar ?? "");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !user) return;
    setSaving(true);
    setNotice(null);
    try {
      const updated = await workspaceApi.updateProfile(token, {
        username: username.trim(),
        bio,
        location,
        phone: phone.trim() || undefined,
        ...(avatar ? { avatar } : {}),
      });
      writeSession({
        token,
        user: { ...user, ...updated },
      });
      onRefresh?.();
      setNotice({ tone: "success", text: copy.accountSaved });
    } catch (err) {
      setNotice({ tone: "error", text: errorMessage(err) });
    } finally {
      setSaving(false);
    }
  };

  // A new photo is saved to the profile straight away, so it shows everywhere (header, menu)
  // without pressing Save; the other fields still save with the form.
  const pickAvatar = async (file: File | undefined) => {
    if (!file || !token || !user) return;
    setUploading(true);
    setNotice(null);
    try {
      const url = await workspaceApi.upload(token, file, "user");
      setAvatar(url);
      const updated = await workspaceApi.updateProfile(token, { avatar: url });
      writeSession({ token, user: { ...user, ...updated, avatar: updated?.avatar ?? url } });
      setNotice({ tone: "success", text: copy.photoSaved });
    } catch (err) {
      setNotice({ tone: "error", text: errorMessage(err) });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <form onSubmit={submit} className="card-violet flex max-w-[620px] flex-col gap-5 rounded-(--radius-panel) p-6">
      <h2 className="text-title font-medium text-white">{copy.accountTitle}</h2>
      <div className="flex items-center gap-4">
        <span className="relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent text-2xl font-medium text-white ring-2 ring-white/10">
          {avatar ? <Photo src={avatar} alt="Profile picture" /> : (username || user?.email || "").charAt(0).toUpperCase()}
          {uploading && (
            <span className="absolute inset-0 flex items-center justify-center bg-black/50">
              <LoaderCircle className="size-5 animate-spin" />
            </span>
          )}
        </span>
        <div className="flex flex-col gap-1">
          <ActionButton variant="ghost" onClick={() => fileRef.current?.click()} disabled={uploading} className="h-9">
            <Camera className="size-4" />
            {copy.profilePhoto}
          </ActionButton>
          <p className="text-xs text-muted">{copy.profilePhotoHint}</p>
        </div>
        <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => pickAvatar(e.target.files?.[0])} />
      </div>
      <Field label={copy.email} value={user?.email ?? ""} disabled readOnly />
      <Field label={copy.username} required minLength={2} maxLength={30} value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />
      <TextArea label={copy.bio} maxLength={250} value={bio} onChange={(e) => setBio(e.target.value)} />
      <Field label="Phone number" maxLength={20} value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" placeholder="+1 (555) 000-0000" />
      <Field label={copy.location} maxLength={100} value={location} onChange={(e) => setLocation(e.target.value)} />
      <div className="flex flex-wrap items-center gap-3">
        <ActionButton type="submit" loading={saving}>
          {copy.saveAccount}
        </ActionButton>
        {notice && <Notice tone={notice.tone}>{notice.text}</Notice>}
      </div>
    </form>
  );
}

function Loading() {
  return (
    <div className="flex justify-center py-16" role="status" aria-label="Loading">
      <LoaderCircle className="size-6 animate-spin text-accent-bright" />
    </div>
  );
}
