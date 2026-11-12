"use client";

import { useState, type FormEvent } from "react";
import { ChevronRight, Globe, LogOut, MapPin, Save } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { ActionButton, Field, Notice, Segmented, TextArea } from "@/components/ui/Controls";
import { useAuth } from "@/features/auth/AuthProvider";
import { useBrandPanel } from "./BrandPanelProvider";
import { BrandAvatar } from "./BrandAvatar";
import { errorMessage } from "./useResource";

/** Profile and store settings (the old panel's right-hand drawer), in the app's shared Modal. */
export function BrandSettings({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Store settings">
      <SettingsForm onClose={onClose} />
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
  const { logout } = useAuth();
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

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError("Enter your brand name.");
    if (!isHttpUrl(websiteUrl.trim())) return setError("Enter your website as a full link starting with https://");
    if (banner.trim() && !isHttpUrl(banner.trim())) return setError("The banner image must be a full link starting with https://");
    setSaving(true);
    setError("");
    try {
      await updateBrand({
        name: name.trim(),
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
        <BrandAvatar name={brand.name} src={brand.logo} className="size-11" />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-white">{brand.name}</p>
          <p className="text-xs text-muted">Profile and store settings</p>
        </div>
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
