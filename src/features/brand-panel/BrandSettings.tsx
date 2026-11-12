"use client";

import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { ChevronRight, Globe, ImagePlus, LogOut, MapPin, Save } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { ActionButton, Field, Notice, Segmented, TextArea } from "@/components/ui/Controls";
import { useAuth } from "@/features/auth/AuthProvider";
import { useBrandPanel } from "./BrandPanelProvider";
import { BrandAvatar } from "./BrandAvatar";
import { brandApi } from "./api";
import { errorMessage } from "./useResource";
import { SecurityPanel } from "./settings/SecurityPanel";
import { TeamPanel } from "./settings/TeamPanel";
import { WidgetPanel } from "./settings/WidgetPanel";
import { cn } from "@/lib/utils";

/** Profile and store settings (the old panel's right-hand drawer), in the app's shared Modal. */
const TABS = [
  { id: "profile", label: "Profile" },
  { id: "widget", label: "Try-on widget" },
  { id: "team", label: "Team" },
  { id: "security", label: "Password" },
] as const;

export function BrandSettings({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("profile");
  return (
    <Modal open={open} onClose={onClose} title="Store settings" className="sm:max-w-[640px]">
      <div role="tablist" aria-label="Settings" className="no-scrollbar -mt-1 mb-5 flex gap-1.5 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn("h-9 shrink-0 rounded-full px-4 text-sm transition-colors", tab === t.id ? "chip-on font-medium" : "glass-pill text-subtle hover:text-white")}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === "profile" && <SettingsForm onClose={onClose} />}
      {tab === "widget" && <WidgetPanel />}
      {tab === "team" && <TeamPanel />}
      {tab === "security" && <SecurityPanel onDone={onClose} />}
    </Modal>
  );
}

function isHttpUrl(value: string) {
  try {
    const { protocol } = new URL(value);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

function SettingsForm({ onClose }: { onClose: () => void }) {
  const { brand, updateBrand } = useBrandPanel();
  const { logout, token } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [logo, setLogo] = useState(brand?.logo ?? "");
  const [uploading, setUploading] = useState(false);
  // Mounted only while open, so these start from the brand as it is right now.
  const [name, setName] = useState(brand?.name ?? "");
  const [story, setStory] = useState(brand?.story ?? "");
  const [banner, setBanner] = useState(brand?.banner ?? "");
  const [websiteUrl, setWebsiteUrl] = useState(brand?.websiteUrl ?? "");
  const [store, setStore] = useState<"online" | "flagship">(brand?.isOnlineOnly === false ? "flagship" : "online");
  const [address, setAddress] = useState(brand?.physicalStoreAddress ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!brand) return null;
  const hasRank = brand.currentRank > 0 && brand.totalBrands > 0;

  const onLogo = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !token) return;
    if (!file.type.startsWith("image/")) return setError("Choose an image file (PNG, JPG or WebP).");
    if (file.size > 5 * 1024 * 1024) return setError("That logo is over 5 MB. Choose a smaller one.");
    setUploading(true);
    setError("");
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result as string);
        r.onerror = () => reject(r.error);
        r.readAsDataURL(file);
      });
      setLogo((await brandApi.uploadBase64(token, dataUrl, file.name)).url);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError("Enter your brand name.");
    if (!isHttpUrl(websiteUrl.trim())) return setError("Enter your website as a full link starting with https://");
    if (store === "flagship" && !address.trim()) return setError("Add your flagship store address, or switch to Online only.");
    if (banner.trim() && !isHttpUrl(banner.trim())) return setError("The banner image must be a full link starting with https://");
    setSaving(true);
    setError("");
    try {
      await updateBrand({
        name: name.trim(),
        ...(logo !== (brand.logo ?? "") ? { logo } : {}),
        story,
        banner: banner.trim(),
        websiteUrl: websiteUrl.trim(),
        isOnlineOnly: store === "online",
        physicalStoreAddress: address,
      });
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} noValidate className="space-y-5">
      <div className="flex items-center gap-3">
        <BrandAvatar name={brand.name} src={logo} className="size-14" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white">{brand.name}</p>
          <p className="text-xs text-muted">Shoppers see this logo on your brand page.</p>
        </div>
        <input ref={fileRef} type="file" accept="image/*" onChange={onLogo} className="hidden" />
        <ActionButton variant="ghost" loading={uploading} onClick={() => fileRef.current?.click()} className="h-9 px-3 text-xs">
          {!uploading && <ImagePlus className="size-4" aria-hidden />}
          {logo ? "Change logo" : "Upload logo"}
        </ActionButton>
      </div>

      {error && <Notice tone="error">{error}</Notice>}

      <section className="space-y-4">
        <h3 className="text-[11px] font-medium uppercase tracking-[0.14em] text-accent-bright">Brand identity</h3>
        <Field label="Brand name" value={name} onChange={(e) => setName(e.target.value)} required />
        <TextArea label="Brand story" value={story} onChange={(e) => setStory(e.target.value)} />
        <Field label="Banner image link" value={banner} onChange={(e) => setBanner(e.target.value)} placeholder="https://…" />
      </section>

      <section className="space-y-4 border-t border-white/8 pt-5">
        <h3 className="text-[11px] font-medium uppercase tracking-[0.14em] text-accent-bright">Store and checkout</h3>
        <Field
          label="Website / checkout link"
          type="url"
          value={websiteUrl}
          onChange={(e) => setWebsiteUrl(e.target.value)}
          placeholder="https://yourbrand.com"
          hint="Shoppers who tap Buy now land on this website."
        />
        <div className="space-y-3 rounded-xl bg-white/[0.03] p-3.5 ring-1 ring-white/8">
          <span className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.08em] text-muted">
            <Globe className="size-3.5" aria-hidden /> Store type
          </span>
          <Segmented
            label="Store type"
            value={store}
            onChange={setStore}
            options={[
              { id: "online", label: "Online only" },
              { id: "flagship", label: "Flagship store" },
            ]}
          />
          {store === "flagship" && (
            <Field label="Flagship address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street, area, city" />
          )}
        </div>
      </section>

      {hasRank && (
        <div className="flex items-center justify-between rounded-xl bg-white/[0.03] p-3.5 ring-1 ring-white/8">
          <div>
            <p className="text-[11px] uppercase tracking-[0.12em] text-muted">Platform rank</p>
            <p className="mt-0.5 text-sm text-white">
              #{brand.currentRank} <span className="text-muted">of {brand.totalBrands} brands</span>
            </p>
          </div>
          {brand.tier && <span className="text-xs text-muted">{brand.tier}</span>}
        </div>
      )}

      <div className="space-y-3">
        <ActionButton type="submit" loading={saving} className="w-full">
          {!saving && <Save className="size-4" aria-hidden />}
          Save changes
        </ActionButton>
        <ActionButton
          variant="danger"
          className="w-full"
          onClick={() => {
            onClose();
            logout();
          }}
        >
          <LogOut className="size-4" aria-hidden />
          Sign out
        </ActionButton>
      </div>

      {isHttpUrl(brand.websiteUrl ?? "") && (
        <a href={brand.websiteUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1 text-xs text-accent-bright hover:underline">
          <MapPin className="size-3" aria-hidden /> Visit store website <ChevronRight className="size-3" aria-hidden />
        </a>
      )}
    </form>
  );
}
